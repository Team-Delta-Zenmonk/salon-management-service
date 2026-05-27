const { Op } = require("sequelize");
const { error } = require("../libs");
const {
  cartRepository,
  bookingRepository,
  bookingServiceRepository,
  staffServiceRepository,
} = require("../repository");
const { acquireTransactionAdvisoryLock } = require("../utils/advisory-lock.util");
const { BookingStatus, BookingType, BookingExecutionMode, BookingSource } = require("../models/booking/booking-types");

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
  const { cart_id, date, slot } = payload.body;
  const createdBy = BookingSource.ENUM.CUSTOMER;

  return await bookingRepository.handleManagedTransaction(async (transaction) => {
    const cart = await cartRepository.getCartByUuid(cart_id);

    if (!cart) {
      throw new error.BadRequest("Cart not found");
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
      const staffAssignment = slot.services.find((s) => s.service_id === cartItem.service_id);

      if (!staffAssignment) {
        throw new error.BadRequest("Staff assignment not found");
      }

      const serviceStart = new Date(new Date(slot.start).getTime() + offset * 60 * 1000);
      const serviceEnd = new Date(serviceStart.getTime() + cartItem.duration * 60 * 1000);

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

    const booking = await bookingRepository.create(
      {
        customer_id: cart.customer_id,
        salon_id: cart.salon_id,
        total_price: cart.total_price,
        total_duration: cart.total_duration,
        booking_type: BookingType.ENUM.SINGLE,
        booking_execution_mode: BookingExecutionMode.ENUM.SEQUENTIAL,
        status: BookingStatus.ENUM.PENDING,
        booking_start_time: new Date(slot.start),
        booking_end_time: new Date(slot.end),
        booking_date: new Date(date),
        created_by: createdBy,
        expires_at: new Date(Date.now() + 11 * 60 * 1000),
        cart_snapshot: snapshot,
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
  });
};

exports.listBookings = async (payload) => {
  const { query, salon } = payload;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const { filter } = query;

  const start = new Date();
  const end = new Date();

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

  const { rows: bookings } = await bookingRepository.findAllBookings({
    page,
    limit,
    start,
    end,
    salon_id: salon.id,
  });

  return bookings;
};

exports.listCustomerBookings = async (payload) => {
  const { query, customer } = payload;
  const { page, limit, status } = query;

  const { rows: bookings, count } = await bookingRepository.findAllCustomerBookings({
    page: Number(page) ?? 1,
    limit: Number(limit) ?? 10,
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
  const { admin_booking, customer_id, booking_start_time, booking_date, services } = payload.body;

  const { salon } = payload;

  if (!salon) {
    throw new error.BadRequest("Salon information is required");
  }

  return await bookingRepository.handleManagedTransaction(async (transaction) => {
    let total_price = 0;
    let total_duration = 0;
    let current_start_time = new Date(booking_start_time);
    const bookingServicesPayload = [];

    const sortedServices = services.map((s, index) => ({ ...s, sequence: s.sequence || index + 1 }));

    for (const service of sortedServices) {
      const staffService = await staffServiceRepository.findOne({
        service_id: service.service_id,
        staff_id: service.staff_id,
      });

      if (!staffService) {
        throw new error.BadRequest(`Staff is not assigned to service ID ${service.service_id}`);
      }

      const duration = staffService.duration;
      const price = staffService.price;
      const service_end_time = new Date(current_start_time.getTime() + duration * 60 * 1000);

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
              status: { [Op.notIn]: [BookingStatus.ENUM.CANCELLED, BookingStatus.ENUM.EXPIRED] },
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
        admin_booking: admin_booking || {},
      },
      { transaction },
    );

    const finalBookingServices = bookingServicesPayload.map((s) => ({
      ...s,
      booking_id: booking.id,
    }));

    await bookingServiceRepository.createBulk(finalBookingServices, { transaction });

    return await bookingRepository.findBookingWithDetails({ id: booking.id }, { transaction });
  });
};

exports.updateAdminBooking = async (payload) => {
  const { uuid } = payload.params;
  const { admin_booking, customer_id, booking_start_time, booking_date, services, status } = payload.body;
  const { salon } = payload;

  return await bookingRepository.handleManagedTransaction(async (transaction) => {
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
    let current_start_time = new Date(booking_start_time || booking.booking_start_time);
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
        });

        if (!staffService) {
          throw new error.BadRequest(`Staff is not assigned to service ID ${service.service_id}`);
        }

        const duration = staffService.duration;
        const price = staffService.price;
        const service_end_time = new Date(current_start_time.getTime() + duration * 60 * 1000);

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
                status: { [Op.notIn]: [BookingStatus.ENUM.CANCELLED, BookingStatus.ENUM.EXPIRED] },
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

    await bookingRepository.update({
      payload: {
        customer_id: customer_id !== undefined ? customer_id : booking.customer_id,
        total_price: Math.round(total_price),
        total_duration,
        status: status || booking.status,
        booking_start_time: new Date(booking_start_time || booking.booking_start_time),
        booking_end_time: final_booking_end_time,
        booking_date: new Date(new_booking_date),
        admin_booking: admin_booking || booking.admin_booking,
      },
      criteria: { id: booking.id },
      options: { transaction },
    });

    if (bookingServicesPayload.length > 0) {
      await bookingServiceRepository.createBulk(bookingServicesPayload, { transaction });
    }

    return await bookingRepository.findBookingWithDetails({ id: booking.id }, { transaction });
  });
};

exports.deleteAdminBooking = async (payload) => {
  const { uuid } = payload.params;
  const { salon } = payload;

  return await bookingRepository.handleManagedTransaction(async (transaction) => {
    const booking = await bookingRepository.findOne({ uuid, salon_id: salon.id }, [], {}, { transaction });

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
  });
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

  return await bookingRepository.handleManagedTransaction(async (transaction) => {
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

    if (booking.status !== BookingStatus.ENUM.PENDING && booking.status !== BookingStatus.ENUM.CONFIRMED) {
      throw new error.BadRequest("Booking cannot be cancelled");
    }

    if (booking.status === BookingStatus.ENUM.PENDING && booking.expires_at && booking.expires_at < new Date()) {
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
    if (booking.booking_end_time.getTime() - new Date().getTime() < TWO_HOURS_IN_MS) {
      throw new error.BadRequest("Booking cannot be cancelled within 2 hours of its end time");
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
  });
};

exports.getBookingByUuid = async ({ uuid, customer }) => {
  const booking = await bookingRepository.findBookingWithDetails({ uuid, customer_id: customer.id });

  if (!booking) {
    throw new error.BadRequest("Booking not found");
  }

  return booking;
};
