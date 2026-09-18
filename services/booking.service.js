const { Op } = require("sequelize");
const { error } = require("../libs");
const {
  cartRepository,
  bookingRepository,
  bookingServiceRepository,
  staffServiceRepository,
  salonRepository,
} = require("../repository");
const {
  acquireTransactionAdvisoryLock,
} = require("../utils/advisory-lock.util");
const { assertStaffActive } = require("../utils/staff-status.util");
const {
  BookingStatus,
  BookingType,
  BookingExecutionMode,
  BookingSource,
} = require("../models/booking/booking-types");
const { PaymentPolicy } = require("../models/salon/salon-types");
const { enqueueInvoiceJob } = require("../jobs/invoice.worker");

function buildBookingSnapshot({ cart, slot }) {
  return {
    salon_id: cart.salon_id,

    slot: {
      start: slot.start,
      end: slot.end,
    },

    services: cart.cart_items
      .sort((a, b) => a.sequence - b.sequence)
      .map((item) => ({
        service_id: item.service_id,
        service_name: item.service?.name,
        duration: item.duration,
        price: item.final_price ?? item.base_price,
        sequence: item.sequence,
      })),

    total_price: cart.total_price,

    total_duration: cart.total_duration,
  };
}

exports.createBooking = async (payload) => {
  const { cart_id, date, slot, payment_preference } = payload.body;
  const createdBy = BookingSource.ENUM.CUSTOMER;

  const result = await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      const cart = await cartRepository.getCartByUuid(cart_id);

      if (!cart) {
        throw new error.BadRequest("Cart not found");
      }

      const salon = await salonRepository.findOne(
        { id: cart.salon_id },
        [],
        {},
        { transaction },
      );
      if (!salon || salon.is_active === false) {
        throw new error.BadRequest(
          "This salon is currently inactive and not accepting bookings",
        );
      }
      if (
        salon.subscription_status === "expired" ||
        salon.subscription_status === "suspended"
      ) {
        throw new error.BadRequest(
          "Online booking is temporarily unavailable for this salon",
        );
      }
      if (
        salon.subscription_status === "trial" &&
        salon.trial_ends_at &&
        new Date(salon.trial_ends_at) < new Date()
      ) {
        throw new error.BadRequest(
          "Online booking is temporarily unavailable for this salon",
        );
      }
      if (
        salon.subscription_status === "active" &&
        salon.subscription_expires_at &&
        new Date(salon.subscription_expires_at) < new Date()
      ) {
        throw new error.BadRequest(
          "Online booking is temporarily unavailable for this salon",
        );
      }

      const cartItems = cart.cart_items.sort((a, b) => a.sequence - b.sequence);

      if (cartItems.length !== slot.services.length) {
        throw new error.BadRequest("Service count mismatch");
      }

      const activePendingBooking = await bookingRepository.findOne(
        {
          customer_id: cart.customer_id,
          salon_id: cart.salon_id,

          status: BookingStatus.ENUM.PENDING,

          expires_at: {
            [Op.gt]: new Date(),
          },
        },
        [],
        {},
        { transaction },
      );
      if (activePendingBooking) {
        return {
          action: "ACTIVE_BOOKING_EXISTS",
          booking: {
            uuid: activePendingBooking.uuid,
            booking_start_time: activePendingBooking.booking_start_time,
            booking_end_time: activePendingBooking.booking_end_time,
            expires_at: activePendingBooking.expires_at,
          },
        };
      }

      const snapshot = buildBookingSnapshot({
        cart,
        slot,
      });

      let offset = 0;
      const executionPlan = [];

      for (const cartItem of cartItems) {
        const staffAssignment = slot.services.find(
          (s) => s.service_id === cartItem.service_id,
        );

        if (!staffAssignment) {
          throw new error.BadRequest("Staff assignment not found");
        }

        const serviceStart = new Date(
          new Date(slot.start).getTime() + offset * 60 * 1000,
        );
        const serviceEnd = new Date(
          serviceStart.getTime() + cartItem.duration * 60 * 1000,
        );

        executionPlan.push({
          service_id: cartItem.service_id,
          staff_id: staffAssignment.staff_id,
          sequence: cartItem.sequence,
          offset_minutes: offset,
          duration_minutes: cartItem.duration,
          price: cartItem.final_price ?? cartItem.base_price,
          start_time: serviceStart,
          end_time: serviceEnd,
        });

        offset += cartItem.duration;
      }

      for (const plan of executionPlan) {
        await acquireTransactionAdvisoryLock({
          transaction,
          staffId: plan.staff_id,
          startTime: plan.start_time,
          endTime: plan.end_time,
        });
      }

      for (const plan of executionPlan) {
        const conflicts = await bookingServiceRepository.findAll({
          criteria: {
            staff_id: plan.staff_id,
            start_time: {
              [Op.lt]: plan.end_time,
            },
            end_time: {
              [Op.gt]: plan.start_time,
            },
          },

          include: [
            {
              association: "booking",
              where: {
                [Op.or]: [
                  {
                    status: BookingStatus.ENUM.CONFIRMED,
                  },

                  {
                    status: BookingStatus.ENUM.PENDING,

                    expires_at: {
                      [Op.gt]: new Date(),
                    },
                  },
                ],
              },
              required: true,
            },
          ],
          transaction,
        });

        if (conflicts.length > 0) {
          throw new error.BadRequest("Staff is not available for this slot");
        }
      }

      const allowedPolicies =
        Array.isArray(cart.salon.allowed_payment_policies) &&
        cart.salon.allowed_payment_policies.length > 0
          ? cart.salon.allowed_payment_policies
          : [PaymentPolicy.ENUM.PAY_AT_VENUE];

      const preference = payment_preference || allowedPolicies[0];

      if (!allowedPolicies.includes(preference)) {
        throw new error.BadRequest(
          `Selected payment option '${preference}' is not enabled by this salon. Enabled options: ${allowedPolicies.join(", ")}`,
        );
      }

      let depositAmount = 0;
      if (preference === PaymentPolicy.ENUM.FULL_UPFRONT) {
        depositAmount = cart.total_price;
      } else if (preference === PaymentPolicy.ENUM.PARTIAL_DEPOSIT) {
        depositAmount = Math.round(
          cart.total_price * ((cart.salon.deposit_percentage || 0) / 100),
        );
      }

      const booking = await bookingRepository.create(
        {
          customer_id: cart.customer_id,
          salon_id: cart.salon_id,
          total_price: cart.total_price,
          total_duration: cart.total_duration,
          booking_type: BookingType.ENUM.SINGLE,
          booking_execution_mode: BookingExecutionMode.ENUM.SEQUENTIAL,
          status:
            preference === PaymentPolicy.ENUM.PAY_AT_VENUE
              ? BookingStatus.ENUM.CONFIRMED
              : BookingStatus.ENUM.PENDING,
          booking_start_time: new Date(slot.start),
          booking_end_time: new Date(slot.end),
          booking_date: new Date(date),
          created_by: createdBy,
          expires_at:
            preference === PaymentPolicy.ENUM.PAY_AT_VENUE
              ? null
              : new Date(Date.now() + 11 * 60 * 1000),
          cart_snapshot: snapshot,
          payment_policy: preference,
          deposit_amount: depositAmount,
        },
        { transaction },
      );

      const bookingServicesPayload = executionPlan.map((plan) => ({
        booking_id: booking.id,
        service_id: plan.service_id,
        staff_id: plan.staff_id,
        sequence: plan.sequence,
        offset_minutes: plan.offset_minutes,
        start_time: plan.start_time,
        end_time: plan.end_time,
        duration_minutes: plan.duration_minutes,
        price: plan.price,
      }));

      await bookingServiceRepository.createBulk(bookingServicesPayload, {
        transaction,
      });

      return {
        action: "BOOKING_CREATED",
        booking,
      };
    },
  );

  enqueueInvoiceJob(result.booking.id).catch((err) =>
    console.error(`[CreateBooking] Failed to enqueue invoice job for Booking #${result.booking?.id}:`, err.message)
  );

  return result;
};

exports.listBookings = async (payload) => {
  const { query, salon } = payload;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 12;
  const {
    filter,
    view,
    payment_policy,
    staff_uuid,
    service_uuid,
    is_walk_in,
    start_date,
    end_date,
  } = query;

  let start, end;

  if (start_date && end_date) {
    start = new Date(start_date);
    end = new Date(end_date);
  } else {
    start = new Date();
    end = new Date();

    if (filter === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (filter === "week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    if (filter === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
  }

  const isCalendar = view === "calendar";

  const { rows: bookings, count } = await bookingRepository.findAllBookings({
    page,
    limit,
    start,
    end,
    salon_id: salon.id,
    payment_policy,
    staff_uuid,
    service_uuid,
    is_walk_in,
    sort_by: isCalendar ? "booking_start_time" : "created_at",
    sort_order: isCalendar ? "ASC" : "DESC",
    no_limit: isCalendar,
  });

  return {
    bookings,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

exports.listCustomerBookings = async (payload) => {
  const { query, customer } = payload;
  const { page, limit, status } = query;

  const { rows: bookings, count } =
    await bookingRepository.findAllCustomerBookings({
      page: page ?? 1,
      limit: limit ?? 12,
      customer_id: customer.id,
      status,
    });

  return {
    bookings,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
    },
  };
};

exports.createAdminBooking = async (payload) => {
  const {
    admin_booking,
    customer_id,
    booking_start_time,
    booking_date,
    services,
    payment_preference,
    payment_policy,
    is_walk_in,
  } = payload.body;

  const { salon } = payload;

  if (!salon) {
    throw new error.BadRequest("Salon information is required");
  }

  const chosenPolicy =
    payment_policy || payment_preference || PaymentPolicy.ENUM.PAY_AT_VENUE;

  const createdBooking = await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      let total_price = 0;
      let total_duration = 0;
      let current_start_time = new Date(booking_start_time);
      const bookingServicesPayload = [];

      const sortedServices = services.map((s, index) => ({
        ...s,
        sequence: s.sequence || index + 1,
      }));

      for (const service of sortedServices) {
        const staffService = await staffServiceRepository.findOne({
          service_id: service.service_id,
          staff_id: service.staff_id,
        }, [
        {
          association: "staff",
          attributes: ["id", "end_date"],
        },
      ]);

        if (!staffService) {
          throw new error.BadRequest(
            `Staff is not assigned to service ID ${service.service_id}`,
          );
        }

      if (staffService.staff) {
        assertStaffActive(staffService.staff, error);
      }

        const duration = staffService.duration;
        const price = staffService.price;
        const service_end_time = new Date(
          current_start_time.getTime() + duration * 60 * 1000,
        );

        await acquireTransactionAdvisoryLock({
          transaction,
          staffId: service.staff_id,
          startTime: current_start_time,
          endTime: service_end_time,
        });

        const conflicts = await bookingServiceRepository.findAll({
          criteria: {
            staff_id: service.staff_id,
            start_time: {
              [Op.lt]: service_end_time,
            },
            end_time: {
              [Op.gt]: current_start_time,
            },
          },
          include: [
            {
              association: "booking",
              where: {
                status: {
                  [Op.notIn]: [
                    BookingStatus.ENUM.CANCELLED,
                    BookingStatus.ENUM.EXPIRED,
                  ],
                },
              },
              required: true,
            },
          ],
          transaction,
        });

        if (conflicts.length > 0) {
          throw new error.BadRequest("Staff is not available for this slot");
        }

        bookingServicesPayload.push({
          service_id: service.service_id,
          staff_id: service.staff_id,
          sequence: service.sequence,
          offset_minutes: total_duration,
          start_time: new Date(current_start_time),
          end_time: service_end_time,
          duration_minutes: duration,
          price: Math.round(parseFloat(price)),
        });

        total_price += parseFloat(price);
        total_duration += duration;
        current_start_time = service_end_time;
      }

    const adminBookingData = {
      ...(admin_booking || {}),
      customer_name: payload.body.customer_name || admin_booking?.customer_name,
      customer_phone: payload.body.customer_phone || admin_booking?.customer_phone,
    };

      const booking = await bookingRepository.create(
        {
          customer_id: customer_id || null,
          salon_id: salon.id,
          total_price: Math.round(total_price),
          total_duration,
          booking_type: BookingType.ENUM.SINGLE,
          booking_execution_mode: BookingExecutionMode.ENUM.SEQUENTIAL,
          status: BookingStatus.ENUM.CONFIRMED,
          booking_start_time: new Date(booking_start_time),
          booking_end_time: current_start_time,
          booking_date: new Date(booking_date),
          created_by: BookingSource.ENUM.ADMIN,
          admin_booking: adminBookingData,
          payment_policy: chosenPolicy,
          deposit_amount:
            chosenPolicy === PaymentPolicy.ENUM.FULL_UPFRONT
              ? Math.round(total_price)
              : chosenPolicy === PaymentPolicy.ENUM.PARTIAL_DEPOSIT
                ? Math.round(
                    total_price * ((salon.deposit_percentage || 0) / 100),
                  )
                : 0,
          is_walk_in: is_walk_in || false,
        },
        { transaction },
      );

      const finalBookingServices = bookingServicesPayload.map((s) => ({
        ...s,
        booking_id: booking.id,
      }));

      await bookingServiceRepository.createBulk(finalBookingServices, {
        transaction,
      });

      return await bookingRepository.findBookingWithDetails(
        { id: booking.id },
        { transaction },
      );
    },
  );

  enqueueInvoiceJob(createdBooking.id).catch((err) =>
    console.error(`[CreateAdminBooking] Failed to enqueue invoice job for Booking #${createdBooking?.id}:`, err.message)
  );

  return createdBooking;
};

exports.updateAdminBooking = async (payload) => {
  const { uuid } = payload.params;
  const {
    admin_booking,
    customer_id,
    booking_start_time,
    booking_date,
    services,
    status,
    payment_preference,
    payment_policy,
    is_walk_in,
  } = payload.body;
  const { salon } = payload;

  return await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      const booking = await bookingRepository.findOne(
        { uuid, salon_id: salon.id },
        [],
        {},
        { transaction, lock: transaction.LOCK.UPDATE },
      );

      if (!booking) {
        throw new error.BadRequest("Booking not found");
      }

      let total_price = booking.total_price;
      let total_duration = booking.total_duration;
      let current_start_time = new Date(
        booking_start_time || booking.booking_start_time,
      );
      let final_booking_end_time = booking.booking_end_time;
      const new_booking_date = booking_date || booking.booking_date;
      const bookingServicesPayload = [];

      if (services && services.length > 0) {
        await bookingServiceRepository.destroy({
          criteria: { booking_id: booking.id },
          options: { transaction, force: true },
        });

        total_price = 0;
        total_duration = 0;

        for (const service of services) {
          const staffService = await staffServiceRepository.findOne({
            service_id: service.service_id,
            staff_id: service.staff_id,
          }, [
          {
            association: "staff",
            attributes: ["id", "end_date"],
          },
        ]);

          if (!staffService) {
            throw new error.BadRequest(
              `Staff is not assigned to service ID ${service.service_id}`,
            );
          }

        if (staffService.staff) {
          assertStaffActive(staffService.staff, error);
        }

          const duration = staffService.duration;
          const price = staffService.price;
          const service_end_time = new Date(
            current_start_time.getTime() + duration * 60 * 1000,
          );

          await acquireTransactionAdvisoryLock({
            transaction,
            staffId: service.staff_id,
            startTime: current_start_time,
            endTime: service_end_time,
          });

          const conflicts = await bookingServiceRepository.findAll({
            criteria: {
              staff_id: service.staff_id,
              start_time: { [Op.lt]: service_end_time },
              end_time: { [Op.gt]: current_start_time },
            },
            include: [
              {
                association: "booking",
                where: {
                  id: { [Op.ne]: booking.id },
                  status: {
                    [Op.notIn]: [
                      BookingStatus.ENUM.CANCELLED,
                      BookingStatus.ENUM.EXPIRED,
                    ],
                  },
                },
                required: true,
              },
            ],
            transaction,
          });

          if (conflicts.length > 0) {
            throw new error.BadRequest("Staff is not available for this slot");
          }

          bookingServicesPayload.push({
            booking_id: booking.id,
            service_id: service.service_id,
            staff_id: service.staff_id,
            sequence: service.sequence || bookingServicesPayload.length + 1,
            offset_minutes: total_duration,
            start_time: new Date(current_start_time),
            end_time: service_end_time,
            duration_minutes: duration,
            price: Math.round(parseFloat(price)),
          });

          total_price += parseFloat(price);
          total_duration += duration;
          current_start_time = service_end_time;
        }
        final_booking_end_time = current_start_time;
      }

      const updatedPolicy =
        payment_policy ||
        payment_preference ||
        booking.payment_policy ||
        PaymentPolicy.ENUM.PAY_AT_VENUE;
      const newDepositAmount =
        updatedPolicy === PaymentPolicy.ENUM.FULL_UPFRONT
          ? Math.round(total_price)
          : updatedPolicy === PaymentPolicy.ENUM.PARTIAL_DEPOSIT
            ? Math.round(total_price * ((salon.deposit_percentage || 0) / 100))
            : 0;

      await bookingRepository.update({
        payload: {
          customer_id:
            customer_id !== undefined ? customer_id : booking.customer_id,
          total_price: Math.round(total_price),
          total_duration,
          status: status || booking.status,
          booking_start_time: new Date(
            booking_start_time || booking.booking_start_time,
          ),
          booking_end_time: final_booking_end_time,
          booking_date: new Date(new_booking_date),
          admin_booking: admin_booking || booking.admin_booking,
          payment_policy: updatedPolicy,
          deposit_amount: newDepositAmount,
          is_walk_in:
            is_walk_in !== undefined ? is_walk_in : booking.is_walk_in,
        },
        criteria: { id: booking.id },
        options: { transaction },
      });

      if (bookingServicesPayload.length > 0) {
        await bookingServiceRepository.createBulk(bookingServicesPayload, {
          transaction,
        });
      }

      return await bookingRepository.findBookingWithDetails(
        { id: booking.id },
        { transaction },
      );
    },
  );
};

exports.rescheduleBooking = async (payload) => {
  const { uuid } = payload.params;
  const { slot, date } = payload.body;
  const { customer } = payload;

  if (!customer) {
    throw new error.Unauthorized("Customer authentication required");
  }

  const newStartTime = new Date(slot.start);

  if (newStartTime.getTime() <= Date.now()) {
    throw new error.BadRequest("Reschedule start time must be in the future");
  }

  return await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      const booking = await bookingRepository.findOne(
        { uuid, customer_id: customer.id },
        [
          {
            association: "booking_services",
          },
        ],
        {},
        { transaction, lock: transaction.LOCK.UPDATE },
      );

      if (!booking) {
        throw new error.BadRequest("Booking not found or not authorized");
      }

      if (
        [
          BookingStatus.ENUM.CANCELLED,
          BookingStatus.ENUM.EXPIRED,
          BookingStatus.ENUM.COMPLETED,
        ].includes(booking.status)
      ) {
        throw new error.BadRequest(
          `Cannot reschedule booking with status '${booking.status}'`,
        );
      }

      if (booking.reschedule_count >= 2) {
        throw new error.BadRequest(
          "Booking can only be rescheduled a maximum of 2 times",
        );
      }

      const bookingServices = booking.booking_services || [];
      if (bookingServices.length === 0) {
        throw new error.BadRequest(
          "Booking has no services associated with it",
        );
      }

      let current_start_time = new Date(newStartTime);
      const updatedServicesPayload = [];

      const sortedServices = bookingServices.sort(
        (a, b) => (a.sequence || 0) - (b.sequence || 0),
      );

      for (const service of sortedServices) {
        const staffService = await staffServiceRepository.findOne({
          service_id: service.service_id,
          staff_id: service.staff_id,
        });

        if (!staffService) {
          throw new error.BadRequest(
            `Staff is not assigned to service ID ${service.service_id}`,
          );
        }

        const duration = staffService.duration;
        const service_end_time = new Date(
          current_start_time.getTime() + duration * 60 * 1000,
        );

        await acquireTransactionAdvisoryLock({
          transaction,
          staffId: service.staff_id,
          startTime: current_start_time,
          endTime: service_end_time,
        });

        const conflicts = await bookingServiceRepository.findAll({
          criteria: {
            staff_id: service.staff_id,
            start_time: {
              [Op.lt]: service_end_time,
            },
            end_time: {
              [Op.gt]: current_start_time,
            },
          },
          include: [
            {
              association: "booking",
              where: {
                id: { [Op.ne]: booking.id },
                status: {
                  [Op.notIn]: [
                    BookingStatus.ENUM.CANCELLED,
                    BookingStatus.ENUM.EXPIRED,
                  ],
                },
              },
              required: true,
            },
          ],
          transaction,
        });

        if (conflicts.length > 0) {
          throw new error.BadRequest("Staff is not available for this slot");
        }

        updatedServicesPayload.push({
          id: service.id,
          start_time: new Date(current_start_time),
          end_time: service_end_time,
        });

        current_start_time = service_end_time;
      }

      await bookingRepository.update({
        payload: {
          booking_start_time: newStartTime,
          booking_end_time: current_start_time,
          booking_date: new Date(date),
          reschedule_count: booking.reschedule_count + 1,
          rescheduled_at: new Date(),
        },
        criteria: { id: booking.id },
        options: { transaction },
      });

      for (const servicePayload of updatedServicesPayload) {
        await bookingServiceRepository.update({
          payload: {
            start_time: servicePayload.start_time,
            end_time: servicePayload.end_time,
          },
          criteria: { id: servicePayload.id },
          options: { transaction },
        });
      }

      return await bookingRepository.findBookingWithDetails(
        { id: booking.id },
        { transaction },
      );
    },
  );
};

exports.deleteAdminBooking = async (payload) => {
  const { uuid } = payload.params;
  const { salon } = payload;

  return await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      const booking = await bookingRepository.findOne(
        { uuid, salon_id: salon.id },
        [],
        {},
        { transaction },
      );

      if (!booking) {
        throw new error.BadRequest("Booking not found");
      }

      await bookingServiceRepository.destroy({
        criteria: { booking_id: booking.id },
        options: { transaction, force: true },
      });

      await bookingRepository.destroy({
        criteria: { id: booking.id },
        options: { transaction, force: true },
      });

      return true;
    },
  );
};

exports.getActiveBooking = async (payload) => {
  const { customer, query } = payload;
  const { salonId } = query || {};

  const booking = await bookingRepository.getActivePendingBooking({
    customer_id: customer.id,
    salon_uuid: salonId,
  });

  if (!booking) {
    return null;
  }

  return booking;
};

exports.cancelBooking = async (payload) => {
  const { uuid } = payload.params;

  const { customer } = payload;

  return await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      const booking = await bookingRepository.findOne(
        {
          uuid,
          customer_id: customer.id,
        },

        [],

        {},

        {
          transaction,

          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!booking) {
        throw new error.BadRequest("Booking not found");
      }

      if (
        booking.status !== BookingStatus.ENUM.PENDING &&
        booking.status !== BookingStatus.ENUM.CONFIRMED
      ) {
        throw new error.BadRequest("Booking cannot be cancelled");
      }

      if (
        booking.status === BookingStatus.ENUM.PENDING &&
        booking.expires_at &&
        booking.expires_at < new Date()
      ) {
        await bookingRepository.update({
          payload: {
            status: BookingStatus.ENUM.EXPIRED,
          },

          criteria: {
            id: booking.id,
          },

          options: {
            transaction,
          },
        });

        throw new error.BadRequest("Booking already expired");
      }

      const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
      if (
        booking.booking_end_time.getTime() - new Date().getTime() <
        TWO_HOURS_IN_MS
      ) {
        throw new error.BadRequest(
          "Booking cannot be cancelled within 2 hours of its end time",
        );
      }

      await bookingRepository.update({
        payload: {
          status: BookingStatus.ENUM.CANCELLED,
        },

        criteria: {
          id: booking.id,
        },

        options: {
          transaction,
        },
      });

      return true;
    },
  );
};

exports.getBookingByUuid = async ({ uuid, customer }) => {
  const booking = await bookingRepository.findBookingWithDetails({
    uuid,
    customer_id: customer.id,
  });

  if (!booking) {
    throw new error.BadRequest("Booking not found");
  }

  return booking;
};

exports.collectPayment = async ({ params }) => {
  const { uuid } = params;
  const booking = await bookingRepository.findOne({ uuid });
  if (!booking) {
    throw new error.BadRequest("Booking not found");
  }
  await bookingRepository.update({
    payload: {
      deposit_amount: booking.total_price,
    },
    criteria: {
      id: booking.id,
    },
  });
  return await bookingRepository.findBookingWithDetails({ id: booking.id });
};
