const { Op } = require("sequelize");
const { error } = require("../libs");
const { cartRepository, bookingRepository, bookingServiceRepository } = require("../repository");
const { BookingStatus, BookingType, BookingExecutionMode, BookingSource } = require("../models/booking/booking-types");

exports.createBooking = async (payload) => {
    const { cart_id, date, slot } = payload.body;
    const createdBy = BookingSource.ENUM.CUSTOMER;

    let cart = await cartRepository.getCardByUuid(cart_id);
    if (!cart) throw new error.BadRequest("Cart not found");

    const cartItems = cart.cart_items.sort((a, b) => a.sequence - b.sequence);

    if (cartItems.length !== slot.services.length) {
        throw new error.BadRequest("Service count mismatch");
    }

    let offset = 0;
    const executionPlan = [];

    for (const cartItem of cartItems) {
        const staffAssignment = slot.services.find(s => s.service_id === cartItem.service_id);
        if (!staffAssignment) throw new error.BadRequest("Staff assignment not found");

        const serviceStart = new Date(
            new Date(slot.start).getTime() + offset * 60 * 1000
        );
        const serviceEnd = new Date(
            serviceStart.getTime() + cartItem.duration * 60 * 1000
        );

        executionPlan.push({
            service_id: cartItem.service_id,
            staff_id: staffAssignment.staff_id,
            sequence: cartItem.sequence,
            offset_minutes: offset,
            duration_minutes: cartItem.duration,
            price: cartItem.price,
            start_time: serviceStart,
            end_time: serviceEnd
        });

        offset += cartItem.duration;
    }

    return await bookingRepository.handleManagedTransaction(async (transaction) => {
        for (const plan of executionPlan) {

            const conflicts = await bookingServiceRepository.findAll({
                criteria: {
                    staff_id: plan.staff_id,
                    start_time: {
                        [Op.lte]: plan.end_time
                    },
                    end_time: {
                        [Op.gte]: plan.start_time
                    }
                },
                include: [
                    {
                        association: "booking",
                        where: {
                            status: { [Op.notIn]: [BookingStatus.ENUM.CANCELLED] },
                        },
                        required: true,
                    },
                ],
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (conflicts.length > 0) {
                throw new error.BadRequest("Staff is not available for this slot");
            }

        }
        const booking = await bookingRepository.create({
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
        }, { transaction })

        const bookingServicesPayload = executionPlan.map(plan => ({
            booking_id: booking.id,
            service_id: plan.service_id,
            staff_id: plan.staff_id,
            sequence: plan.sequence,
            offset_minutes: plan.offset_minutes,
            start_time: plan.start_time,
            end_time: plan.end_time,
            duration_minutes: plan.duration_minutes,
            price: plan.price
        }));

        await bookingServiceRepository.createBulk(bookingServicesPayload, { transaction });

        return booking;
    });
}

exports.listBookings = async (payload) => {
    const { page, limit, filter } = payload;

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

    const { salon } = payload;

    const { rows: bookings, count } = await bookingRepository.findAllBookings({ page, limit, start, end, salon_id: salon.id });

    return bookings;
}

exports.createAdminBooking = async (payload) => {
    const { 
        admin_booking, 
        customer_id, 
        total_price, 
        total_duration, 
        booking_type, 
        booking_execution_mode, 
        status, 
        booking_start_time, 
        booking_end_time, 
        booking_date,
        services 
    } = payload.body;
    
    const { salon } = payload;

    if (!salon) {
        throw new error.BadRequest("Salon information is required");
    }

    return await bookingRepository.handleManagedTransaction(async (transaction) => {
        // Check for conflicts with existing bookings
        for (const service of services) {
            const conflicts = await bookingServiceRepository.findAll({
                criteria: {
                    staff_id: service.staff_id,
                    start_time: {
                        [Op.lte]: new Date(service.end_time)
                    },
                    end_time: {
                        [Op.gte]: new Date(service.start_time)
                    }
                },
                include: [
                    {
                        association: "booking",
                        where: {
                            status: { [Op.notIn]: [BookingStatus.ENUM.CANCELLED] },
                        },
                        required: true,
                    },
                ],
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (conflicts.length > 0) {
                throw new error.BadRequest("Staff is not available for this slot");
            }
        }

        // Create the booking
        const booking = await bookingRepository.create({
            customer_id: customer_id || null,
            salon_id: salon.id,
            total_price,
            total_duration,
            booking_type,
            booking_execution_mode,
            status,
            booking_start_time: new Date(booking_start_time),
            booking_end_time: new Date(booking_end_time),
            booking_date: new Date(booking_date),
            created_by: BookingSource.ENUM.ADMIN,
            admin_booking: admin_booking || {},
        }, { transaction });

        // Create booking services
        const bookingServicesPayload = services.map(service => ({
            booking_id: booking.id,
            service_id: service.service_id,
            staff_id: service.staff_id,
            sequence: service.sequence,
            offset_minutes: service.offset_minutes,
            start_time: new Date(service.start_time),
            end_time: new Date(service.end_time),
            duration_minutes: service.duration_minutes,
            price: service.price
        }));

        await bookingServiceRepository.createBulk(bookingServicesPayload, { transaction });

        return booking;
    });
}
