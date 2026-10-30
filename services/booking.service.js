const crypto = require("crypto");
const { Op } = require("sequelize");
const stripe = require("../config/stripe");
const { error } = require("../libs");
const {
  cartRepository,
  bookingRepository,
  bookingServiceRepository,
  staffServiceRepository,
  serviceRepository,
  salonRepository,
  invoiceRepository,
  cartItemRepository,
  staffRepository,
  holidayRepository,
  paymentRepository,
} = require("../repository");
const {
  acquireTransactionAdvisoryLock,
} = require("../utils/advisory-lock.util");
const { assertStaffActive } = require("../utils/staff-status.util");
const { calculateFinalPrice } = require("../utils/pricing.util");
const { assertServiceBookable, assertServicesBookable } = require("../utils/service-validation.util");
const {
  BookingStatus,
  BookingType,
  BookingExecutionMode,
  BookingSource,
} = require("../models/booking/booking-types");
const { PaymentPolicy } = require("../models/salon/salon-types");
const { PaymentStatus } = require("../models/payment/payment-types");
const { enqueueInvoiceJob } = require("../jobs/invoice.worker");
const { enqueueNotificationJob } = require("../jobs/notification.worker");
const invoiceService = require("./invoice.service");
const paymentService = require("./payment.service");
const { getCurrencyConfig } = require("../common/currencies.config");
const { syncCartState } = require("./cart.service");

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
      let cart = await cartRepository.findOne(
        { uuid: cart_id, deleted_at: null },
        [],
        {},
        { transaction },
      );

      if (!cart) {
        throw new error.BadRequest("Cart not found");
      }

      await syncCartState(cart, transaction);

      cart = await cartRepository.findOne(
        { id: cart.id, deleted_at: null },
        cartRepository.cartIncludes(),
        {},
        { transaction },
      );

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
        if (!plan.staff_id) continue;
        await acquireTransactionAdvisoryLock({
          transaction,
          staffId: plan.staff_id,
          startTime: plan.start_time,
          endTime: plan.end_time,
        });
      }

      for (const plan of executionPlan) {
        if (!plan.staff_id) continue;
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

      let allowedPolicies =
        Array.isArray(cart.salon.allowed_payment_policies) &&
        cart.salon.allowed_payment_policies.length > 0
          ? [...cart.salon.allowed_payment_policies]
          : [PaymentPolicy.ENUM.PAY_AT_VENUE];

      if (!salon?.stripe_account_id) {
        allowedPolicies = allowedPolicies.filter(
          (p) => p === PaymentPolicy.ENUM.PAY_AT_VENUE
        );
        if (allowedPolicies.length === 0) {
          allowedPolicies = [PaymentPolicy.ENUM.PAY_AT_VENUE];
        }
      }

      const preference = payment_preference || allowedPolicies[0];

      if (!allowedPolicies.includes(preference)) {
        if (
          !salon?.stripe_account_id &&
          (preference === PaymentPolicy.ENUM.PARTIAL_DEPOSIT ||
            preference === PaymentPolicy.ENUM.FULL_UPFRONT)
        ) {
          throw new error.BadRequest(
            "Online payment is not available for this salon because Stripe is not connected. Please choose 'Pay at Venue'."
          );
        }
        throw new error.BadRequest(
          `Selected payment option '${preference}' is not enabled by this salon. Enabled options: ${allowedPolicies.join(", ")}`,
        );
      }

      const currencyConfig = getCurrencyConfig(salon.currency || "INR");
      let depositAmount = 0;
      if (preference === PaymentPolicy.ENUM.FULL_UPFRONT) {
        depositAmount = cart.total_price;
      } else if (preference === PaymentPolicy.ENUM.PARTIAL_DEPOSIT) {
        const calculatedDeposit = Math.round(
          cart.total_price * ((cart.salon.deposit_percentage || 0) / 100),
        );
        depositAmount = Math.min(cart.total_price, Math.max(calculatedDeposit, currencyConfig.minChargeAmount));
      }

      if (preference !== PaymentPolicy.ENUM.PAY_AT_VENUE && depositAmount < currencyConfig.minChargeAmount) {
        throw new error.BadRequest(
          `Minimum online payment amount is ${currencyConfig.symbol}${currencyConfig.minChargeAmount}. Please choose 'Pay at Venue' or add more services.`
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

      let clientSecret = null;
      let paymentId = null;

      if (preference !== PaymentPolicy.ENUM.PAY_AT_VENUE) {
        const paymentResult = await paymentService.generatePaymentIntentForBooking({
          booking,
          salon,
          attemptNo: 1,
          transaction,
        });
        clientSecret = paymentResult.clientSecret;
        paymentId = paymentResult.paymentId;
      }

      await cartItemRepository.softDelete(
        { cart_id: cart.id },
        { transaction }
      );
      await cartRepository.softDelete(
        { id: cart.id },
        { transaction }
      );

      return {
        action: "BOOKING_CREATED",
        booking,
        clientSecret,
        paymentId,
      };
    },
  );

  if (result.action === "BOOKING_CREATED" && result.booking.status === BookingStatus.ENUM.CONFIRMED) {
    enqueueNotificationJob({
      salonId: result.booking.salon_id,
      bookingId: result.booking.id,
      type: "BOOKING_CREATED",
      title: "New Booking Received",
      message: `New booking #${result.booking.uuid.slice(0, 8)} created for ${new Date(result.booking.booking_date).toLocaleDateString()} at ${new Date(result.booking.booking_start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      data: {
        booking_uuid: result.booking.uuid,
        customer_id: result.booking.customer_id,
        booking_date: result.booking.booking_date,
        booking_start_time: result.booking.booking_start_time,
        total_price: result.booking.total_price,
        source: "CUSTOMER",
      },
    }).catch((err) =>
      console.error(`[CreateBooking] Failed to enqueue notification job for Booking #${result.booking?.id}:`, err.message)
    );
  }

  return result;
};

exports.listBookings = async (payload) => {
  const { query, salon } = payload;
  const page = Number(query.page) || 1;
  const limit = Math.min(10, Number(query.limit) || 10);
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

const getMaxRescheduleAttempts = (bookingRecord) => {
  if (bookingRecord && typeof bookingRecord.max_reschedule_attempts === "number") {
    return bookingRecord.max_reschedule_attempts;
  }
  const defaultVal = bookingRepository.model?.rawAttributes?.max_reschedule_attempts?.defaultValue;
  return typeof defaultVal === "number" ? defaultVal : 2;
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

  const formattedBookings = bookings.map((b) => {
    const bookingJson = b.toJSON ? b.toJSON() : b;
    const rescheduleCount = bookingJson.reschedule_count || 0;
    const maxAttempts = getMaxRescheduleAttempts(bookingJson);
    return {
      ...bookingJson,
      max_reschedule_attempts: maxAttempts,
      remaining_reschedule_count: Math.max(0, maxAttempts - rescheduleCount),
    };
  });

  return {
    bookings: formattedBookings,
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
    payment_status,
    payment_method,
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
      const initial_start_time = new Date(booking_start_time);
      if (
        booking_date &&
        !isNaN(new Date(booking_date).getTime()) &&
        !isNaN(initial_start_time.getTime())
      ) {
        const bDate = new Date(booking_date);
        initial_start_time.setFullYear(
          bDate.getFullYear(),
          bDate.getMonth(),
          bDate.getDate(),
        );
      }
      let current_start_time = new Date(initial_start_time);
      const bookingServicesPayload = [];

      const sortedServices = services.map((s, index) => ({
        ...s,
        sequence: s.sequence || index + 1,
      }));

      const serviceIds = sortedServices.map((s) => s.service_id);
      const fetchedServices = await serviceRepository.findAll({
        criteria: { id: { [Op.in]: serviceIds } },
      });
      const serviceMap = new Map(fetchedServices.map((s) => [s.id, s]));

      for (const service of sortedServices) {
        if (!serviceMap.has(service.service_id)) {
          throw new error.BadRequest(`Service ID ${service.service_id} not found`);
        }
      }

      await assertServicesBookable(fetchedServices, "booked");

      for (const service of sortedServices) {
        let duration = 0;
        let price = 0;

        const serviceObj = serviceMap.get(service.service_id);

        if (service.staff_id) {
          let staffService = await staffServiceRepository.findOne({
            service_id: service.service_id,
            staff_id: service.staff_id,
          }, [
            {
              association: "staff",
              attributes: ["id", "end_date"],
            },
          ]);

          if (!staffService && serviceObj.parent_id) {
            staffService = await staffServiceRepository.findOne({
              service_id: serviceObj.parent_id,
              staff_id: service.staff_id,
            }, [
              {
                association: "staff",
                attributes: ["id", "end_date"],
              },
            ]);
          }

          if (!staffService) {
            throw new error.BadRequest(
              `Staff is not assigned to service ID ${service.service_id}`,
            );
          }

          if (staffService.staff) {
            assertStaffActive(staffService.staff, error);
          }

          duration = staffService.duration || serviceObj.duration;
          price = staffService.price !== undefined && staffService.price !== null ? staffService.price : serviceObj.price;
        } else {
          duration = serviceObj.duration;
          price = serviceObj.price;
        }

        price = calculateFinalPrice({
          basePrice: price,
          discount: serviceObj.discount,
          discountType: serviceObj.discount_type,
        });

        const service_end_time = new Date(
          current_start_time.getTime() + duration * 60 * 1000,
        );

        if (service.staff_id) {
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
        }

        bookingServicesPayload.push({
          service_id: service.service_id,
          staff_id: service.staff_id || null,
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
          booking_start_time: initial_start_time,
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
          amount_paid_online:
            chosenPolicy === PaymentPolicy.ENUM.FULL_UPFRONT || payment_status?.toLowerCase() === "paid"
              ? Math.round(total_price)
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

  const isPaidUpfront =
    chosenPolicy === PaymentPolicy.ENUM.FULL_UPFRONT ||
    payment_status?.toLowerCase() === "paid";

  if (isPaidUpfront) {
    invoiceService
      .createBookingInvoice(createdBooking, {
        payment_status: "PAID",
        payment_method: payment_method || "Full Upfront",
      })
      .then((inv) => {
        if (inv?.id) enqueueInvoiceJob(inv.id);
      })
      .catch((err) =>
        console.error(`[CreateAdminBooking] Failed to create/enqueue invoice for Booking #${createdBooking?.id}:`, err.message)
      );
  }

  const clientName = createdBooking.admin_booking?.name || createdBooking.customer?.name || "Client";
  enqueueNotificationJob({
    salonId: salon.id,
    bookingId: createdBooking.id,
    type: "BOOKING_CREATED",
    title: "New Booking Created",
    message: `New booking #${createdBooking.uuid.slice(0, 8)} created for ${clientName} on ${new Date(createdBooking.booking_date).toLocaleDateString()} at ${new Date(createdBooking.booking_start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
    data: {
      booking_uuid: createdBooking.uuid,
      customer_name: clientName,
      booking_date: createdBooking.booking_date,
      booking_start_time: createdBooking.booking_start_time,
      total_price: createdBooking.total_price,
      source: "ADMIN",
    },
  }).catch((err) =>
    console.error(`[CreateAdminBooking] Failed to enqueue notification job for Booking #${createdBooking?.id}:`, err.message)
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

  let previousStatus;
  let previousDate;
  let previousStartTime;

  const updatedBooking = await bookingRepository.handleManagedTransaction(
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

      previousStatus = booking.status;
      previousDate = new Date(booking.booking_date).getTime();
      previousStartTime = new Date(booking.booking_start_time).getTime();

      if (status === BookingStatus.ENUM.COMPLETED) {
        const now = new Date();
        const bDate = new Date(booking_date || booking.booking_date);

        const bookingDayUtc = bDate.toISOString().slice(0, 10);
        const todayUtc = now.toISOString().slice(0, 10);

        const bookingDayLocal = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        if (bookingDayUtc > todayUtc && bookingDayLocal > todayLocal) {
          throw new error.BadRequest(
            "Cannot mark a future booking as completed before its start time",
          );
        }
      }

      let total_price = booking.total_price;
      let total_duration = booking.total_duration;
      const new_booking_date = booking_date || booking.booking_date;
      let updated_start_time = new Date(
        booking_start_time || booking.booking_start_time,
      );
      if (
        new_booking_date &&
        !isNaN(new Date(new_booking_date).getTime()) &&
        !isNaN(updated_start_time.getTime())
      ) {
        const bDate = new Date(new_booking_date);
        updated_start_time.setFullYear(
          bDate.getFullYear(),
          bDate.getMonth(),
          bDate.getDate(),
        );
      }
      let current_start_time = new Date(updated_start_time);
      let final_booking_end_time = booking.booking_end_time
        ? new Date(booking.booking_end_time)
        : current_start_time;
      if (!(services && services.length > 0) && total_duration) {
        final_booking_end_time = new Date(
          updated_start_time.getTime() + total_duration * 60 * 1000,
        );
      }
      const bookingServicesPayload = [];

      if (services && services.length > 0) {
        await bookingServiceRepository.destroy({
          criteria: { booking_id: booking.id },
          options: { transaction, force: true },
        });

        total_price = 0;
        total_duration = 0;

        const serviceIds = services.map((s) => s.service_id);
        const fetchedServices = await serviceRepository.findAll({
          criteria: { id: { [Op.in]: serviceIds } },
        });
        const serviceMap = new Map(fetchedServices.map((s) => [s.id, s]));

        for (const service of services) {
          if (!serviceMap.has(service.service_id)) {
            throw new error.BadRequest(`Service ID ${service.service_id} not found`);
          }
        }

        await assertServicesBookable(fetchedServices, "booked");

        for (const service of services) {
          let duration = 0;
          let price = 0;

          const serviceObj = serviceMap.get(service.service_id);

          if (service.staff_id) {
            let staffService = await staffServiceRepository.findOne({
              service_id: service.service_id,
              staff_id: service.staff_id,
            }, [
              {
                association: "staff",
                attributes: ["id", "end_date"],
              },
            ]);

            if (!staffService && serviceObj.parent_id) {
              staffService = await staffServiceRepository.findOne({
                service_id: serviceObj.parent_id,
                staff_id: service.staff_id,
              }, [
                {
                  association: "staff",
                  attributes: ["id", "end_date"],
                },
              ]);
            }

            if (!staffService) {
              throw new error.BadRequest(
                `Staff is not assigned to service ID ${service.service_id}`,
              );
            }

            if (staffService.staff) {
              assertStaffActive(staffService.staff, error);
            }

            duration = staffService.duration || serviceObj.duration;
            price = staffService.price !== undefined && staffService.price !== null ? staffService.price : serviceObj.price;
          } else {
            duration = serviceObj.duration;
            price = serviceObj.price;
          }

          price = calculateFinalPrice({
            basePrice: price,
            discount: serviceObj.discount,
            discountType: serviceObj.discount_type,
          });

          const service_end_time = new Date(
            current_start_time.getTime() + duration * 60 * 1000,
          );

          if (service.staff_id) {
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
          }

          bookingServicesPayload.push({
            booking_id: booking.id,
            service_id: service.service_id,
            staff_id: service.staff_id || null,
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
          booking_start_time: updated_start_time,
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

  if (previousStatus !== BookingStatus.ENUM.CANCELLED && updatedBooking.status === BookingStatus.ENUM.CANCELLED) {
    enqueueNotificationJob({
      salonId: salon.id,
      bookingId: updatedBooking.id,
      type: "BOOKING_CANCELLED",
      title: "Booking Cancelled",
      message: `Booking #${updatedBooking.uuid.slice(0, 8)} has been cancelled.`,
      data: {
        booking_uuid: updatedBooking.uuid,
        customer_id: updatedBooking.customer_id,
        action_by: "ADMIN",
      },
    }).catch((err) => console.error("[UpdateAdminBooking] Notification error:", err.message));
  } else if (previousStatus !== BookingStatus.ENUM.COMPLETED && updatedBooking.status === BookingStatus.ENUM.COMPLETED) {
    enqueueNotificationJob({
      salonId: salon.id,
      bookingId: updatedBooking.id,
      type: "BOOKING_COMPLETED",
      title: "Booking Completed",
      message: `Booking #${updatedBooking.uuid.slice(0, 8)} has been marked as completed.`,
      data: {
        booking_uuid: updatedBooking.uuid,
        customer_id: updatedBooking.customer_id,
        action_by: "ADMIN",
      },
    }).catch((err) => console.error("[UpdateAdminBooking] Notification error:", err.message));
  } else if (
    previousDate !== new Date(updatedBooking.booking_date).getTime() ||
    previousStartTime !== new Date(updatedBooking.booking_start_time).getTime()
  ) {
    enqueueNotificationJob({
      salonId: salon.id,
      bookingId: updatedBooking.id,
      type: "BOOKING_RESCHEDULED",
      title: "Booking Rescheduled",
      message: `Booking #${updatedBooking.uuid.slice(0, 8)} date and time slot updated to ${new Date(updatedBooking.booking_date).toLocaleDateString()} at ${new Date(updatedBooking.booking_start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      data: {
        booking_uuid: updatedBooking.uuid,
        customer_id: updatedBooking.customer_id,
        booking_date: updatedBooking.booking_date,
        booking_start_time: updatedBooking.booking_start_time,
        action_by: "ADMIN",
      },
    }).catch((err) => console.error("[UpdateAdminBooking] Notification error:", err.message));
  }

  const isPaid =
    updatedBooking.payment_policy === PaymentPolicy.ENUM.FULL_UPFRONT ||
    payload.body.payment_status?.toLowerCase() === "paid" ||
    updatedBooking.status === BookingStatus.ENUM.COMPLETED;

  if (isPaid) {
    const existingInvoice = await invoiceRepository.findOne({ booking_id: updatedBooking.id });
    if (existingInvoice) {
      if (existingInvoice.payment_status !== "PAID") {
        await invoiceRepository.update({
          payload: {
            amount_paid: updatedBooking.total_price,
            balance_due: 0,
            payment_status: "PAID",
            payment_method: payload.body.payment_method || existingInvoice.payment_method || "Full Upfront",
          },
          criteria: { id: existingInvoice.id },
        });
        enqueueInvoiceJob(existingInvoice.id).catch((err) =>
          console.error(`[UpdateAdminBooking] Failed to enqueue invoice job: ${err.message}`)
        );
      }
    } else {
      invoiceService
        .createBookingInvoice(updatedBooking, {
          payment_status: "PAID",
          payment_method: payload.body.payment_method || "Full Upfront",
        })
        .then((inv) => {
          if (inv?.id) enqueueInvoiceJob(inv.id);
        })
        .catch((err) =>
          console.error(`[UpdateAdminBooking] Failed to create/enqueue invoice for Booking #${updatedBooking?.id}:`, err.message)
        );
    }
  }

  return updatedBooking;
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

  const result = await bookingRepository.handleManagedTransaction(
    async (transaction) => {
      const booking = await bookingRepository.findOne(
        { uuid, customer_id: customer.id },
        [],
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

      const maxAttempts = getMaxRescheduleAttempts(booking);
      if (booking.reschedule_count >= maxAttempts) {
        throw new error.BadRequest(
          `Booking can only be rescheduled a maximum of ${maxAttempts} times`,
        );
      }

      const bookingServices = await bookingServiceRepository.findAll({
        criteria: { booking_id: booking.id },
        transaction,
      });

      if (!bookingServices || bookingServices.length === 0) {
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
        let staffService = await staffServiceRepository.findOne({
          service_id: service.service_id,
          staff_id: service.staff_id,
        });

        if (!staffService) {
          const serviceObj = await serviceRepository.findOne({ id: service.service_id });
          if (serviceObj && serviceObj.parent_id) {
            staffService = await staffServiceRepository.findOne({
              service_id: serviceObj.parent_id,
              staff_id: service.staff_id,
            });
          }
        }

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

  enqueueNotificationJob({
    salonId: result.salon_id,
    bookingId: result.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message: `Booking #${result.uuid.slice(0, 8)} rescheduled by customer to ${new Date(result.booking_date).toLocaleDateString()} at ${new Date(result.booking_start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
    data: {
      booking_uuid: result.uuid,
      customer_id: result.customer_id,
      booking_date: result.booking_date,
      booking_start_time: result.booking_start_time,
      reschedule_count: result.reschedule_count,
      action_by: "CUSTOMER",
    },
  }).catch((err) =>
    console.error(`[RescheduleBooking] Failed to enqueue notification job for Booking #${result?.id}:`, err.message)
  );

  return result;
};

exports.deleteAdminBooking = async (payload) => {
  const { uuid } = payload.params;
  const { salon } = payload;

  await bookingRepository.handleManagedTransaction(
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
        options: { transaction },
      });

      await invoiceRepository.destroy({
        criteria: { booking_id: booking.id },
        options: { transaction },
      });

      await bookingRepository.destroy({
        criteria: { id: booking.id },
        options: { transaction },
      });

      return true;
    },
  );

  enqueueNotificationJob({
    salonId: salon.id,
    bookingId: null,
    type: "BOOKING_DELETED",
    title: "Booking Deleted",
    message: `Booking #${uuid.slice(0, 8)} has been deleted.`,
    data: {
      booking_uuid: uuid,
      action_by: "ADMIN",
    },
  }).catch((err) =>
    console.error("[DeleteAdminBooking] Notification error:", err.message)
  );

  return true;
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

  const cancelledBooking = await bookingRepository.handleManagedTransaction(
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

      return booking;
    },
  );

  enqueueNotificationJob({
    salonId: cancelledBooking.salon_id,
    bookingId: cancelledBooking.id,
    type: "BOOKING_CANCELLED",
    title: "Booking Cancelled",
    message: `Booking #${cancelledBooking.uuid.slice(0, 8)} has been cancelled by customer.`,
    data: {
      booking_uuid: cancelledBooking.uuid,
      customer_id: cancelledBooking.customer_id,
      action_by: "CUSTOMER",
    },
  }).catch((err) =>
    console.error("[CancelBooking] Notification error:", err.message)
  );

  return cancelledBooking;
};

exports.getBookingByUuid = async ({ uuid, customer }) => {
  let booking = await bookingRepository.findBookingWithDetails({
    uuid,
    customer_id: customer.id,
  });

  if (!booking) {
    throw new error.BadRequest("Booking not found");
  }

  if (booking.status === BookingStatus.ENUM.PENDING) {
    try {
      const pendingPayment = await paymentRepository.findOne({
        booking_id: booking.id,
        status: PaymentStatus.ENUM.PENDING,
      });

      if (pendingPayment?.stripe_payment_intent_id) {
        const intent = await stripe.paymentIntents.retrieve(
          pendingPayment.stripe_payment_intent_id
        );
        if (intent.status === "succeeded") {
          await paymentService.handlePaymentSucceeded(intent);
          booking = await bookingRepository.findBookingWithDetails({
            uuid,
            customer_id: customer.id,
          });
        }
      }
    } catch (syncErr) {
      console.warn("[GetBookingByUuid] Could not sync Stripe payment intent:", syncErr.message);
    }
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
      amount_paid_online: booking.total_price,
    },
    criteria: {
      id: booking.id,
    },
  });

  const updatedBooking = await bookingRepository.findBookingWithDetails({ id: booking.id });

  const existingInvoice = await invoiceRepository.findOne({ booking_id: booking.id });
  if (existingInvoice) {
    await invoiceRepository.update({
      payload: {
        amount_paid: booking.total_price,
        balance_due: 0,
        payment_status: "PAID",
      },
      criteria: { id: existingInvoice.id },
    });
    enqueueInvoiceJob(existingInvoice.id).catch((err) =>
      console.error(`[CollectPayment] Failed to enqueue invoice job: ${err.message}`)
    );
  } else {
    invoiceService
      .createBookingInvoice(
        updatedBooking,
        { payment_status: "PAID", payment_method: booking.payment_policy === "pay_at_venue" ? "Pay At Venue" : "Full Upfront" }
      )
      .then((inv) => {
        if (inv?.id) enqueueInvoiceJob(inv.id);
      })
      .catch((err) =>
        console.error(`[CollectPayment] Failed to create invoice: ${err.message}`)
      );
  }

  return updatedBooking;
};

const toISODateTime = (dateStr, minutes) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMinutes(minutes);
  return d.toISOString();
};

const toMinutes = (dateTime) => {
  if (typeof dateTime === "string" && /^\d{1,2}:\d{2}$/.test(dateTime)) {
    const [h, m] = dateTime.split(":").map(Number);
    return h * 60 + m;
  }
  const d = new Date(dateTime);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

const isStaffAvailable = (
  staff,
  serviceStart,
  serviceEnd,
  dateStr,
  staffHolidays,
  bookingsByStaff,
) => {
  if (staffHolidays.get(staff.id)?.has(dateStr)) {
    return false;
  }

  const day = new Date(dateStr).getDay();

  const active = staff.active_hours?.[day];
  if (!active) {
    return false;
  }

  const activeStart = toMinutes(active.start_time);
  const activeEnd = toMinutes(active.end_time);

  if (serviceStart < activeStart || serviceEnd > activeEnd) {
    return false;
  }

  const staffBookings = bookingsByStaff[staff.id] || [];

  const serviceStartDate = new Date(dateStr);
  serviceStartDate.setUTCHours(0, 0, 0, 0);
  serviceStartDate.setUTCMinutes(serviceStart);

  const serviceEndDate = new Date(dateStr);
  serviceEndDate.setUTCHours(0, 0, 0, 0);
  serviceEndDate.setUTCMinutes(serviceEnd);

  for (const booking of staffBookings) {
    if (serviceStartDate < booking.end && serviceEndDate > booking.start) {
      return false;
    }
  }

  return true;
};

exports.getBookingAvailableSlots = async (payload) => {
  const { uuid } = payload.params;
  const { start_date, days = 7 } = payload.query;
  const { customer } = payload;

  if (!customer) {
    throw new error.Unauthorized("Customer authentication required");
  }

  const booking = await bookingRepository.findBookingWithDetails({
    uuid,
    customer_id: customer.id,
  });

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
    throw new error.BadRequest(`Cannot reschedule booking with status '${booking.status}'`);
  }

  const maxAttempts = getMaxRescheduleAttempts(booking);
  if (booking.reschedule_count >= maxAttempts) {
    throw new error.BadRequest(`Booking can only be rescheduled a maximum of ${maxAttempts} times`);
  }

  const salon = booking.salon;
  if (!salon) {
    throw new error.BadRequest("Salon not found");
  }

  const bookingServices = (booking.booking_services || []).sort(
    (a, b) => (a.sequence || 0) - (b.sequence || 0)
  );

  if (bookingServices.length === 0) {
    throw new error.BadRequest("Booking has no services");
  }

  const totalDuration = booking.total_duration || bookingServices.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  const parsedDays = Number(days);
  const salonHolidays = await holidayRepository.getSalonHolidaysByDate(
    salon.id,
    start_date,
    parsedDays,
  );

  const staffIds = [
    ...new Set(
      bookingServices.map((s) => s.staff_id).filter(Boolean)
    ),
  ];

  const staffMembers = await staffRepository.findAll({
    criteria: { id: { [Op.in]: staffIds }, salon_id: salon.id },
  });
  const staffById = staffMembers.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const staffHolidays = await holidayRepository.getStaffHolidaysByDate(
    staffIds,
    start_date,
    parsedDays,
  );

  const bookingsByStaff = await bookingServiceRepository.getBookingsByStaff({
    salon_id: salon.id,
    start_date,
    days: parsedDays,
    exclude_booking_id: booking.id,
  });

  const result = [];
  const now = new Date();

  for (let d = 0; d < parsedDays; d++) {
    const date = new Date(start_date);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);
    const dayOfWeek = date.getDay();

    if (salonHolidays.includes(dateStr)) {
      continue;
    }

    const businessHours = salon.business_hours?.[dayOfWeek];
    if (!businessHours?.start_time || !businessHours?.end_time) {
      continue;
    }

    const dayStart = toMinutes(businessHours.start_time);
    const dayEnd = toMinutes(businessHours.end_time);

    const slots = [];

    for (
      let slotStart = dayStart;
      slotStart + totalDuration <= dayEnd;
      slotStart += 15
    ) {
      const slotStartIso = toISODateTime(dateStr, slotStart);
      if (new Date(slotStartIso).getTime() <= now.getTime()) {
        continue;
      }

      let offset = 0;
      let validSlot = true;
      const serviceOptions = [];

      for (const service of bookingServices) {
        const duration = service.duration_minutes;
        const serviceStart = slotStart + offset;
        const serviceEnd = serviceStart + duration;
        offset += duration;

        const staff = staffById[service.staff_id];
        if (
          !staff ||
          !isStaffAvailable(
            staff,
            serviceStart,
            serviceEnd,
            dateStr,
            staffHolidays,
            bookingsByStaff,
          )
        ) {
          validSlot = false;
          break;
        }

        serviceOptions.push({
          service_id: service.service_id,
          staff_id: service.staff_id,
        });
      }

      if (validSlot) {
        slots.push({
          start: slotStartIso,
          end: toISODateTime(dateStr, slotStart + totalDuration),
          services: serviceOptions,
        });
      }
    }

    if (slots.length) {
      result.push({ date: dateStr, slots });
    }
  }

  return result;
};

