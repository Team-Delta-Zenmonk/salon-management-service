const { error } = require("../libs");
const { DayOfWeek } = require("../models/salon/salon-types");
const {
    salonRepository,
    cartRepository,
    holidayRepository,
    staffRepository,
    staffServiceRepository,
    bookingServiceRepository,
} = require("../repository");
const { Op } = require("sequelize");
const { Category, sequelize } = require("../models");

exports.updateSalon = async (payload) => {
    const { uuid } = payload.salon;

    if (payload?.body?.business_hours) {
        const result = {};
        for (const [day, value] of Object.entries(payload.body.business_hours)) {
            result[DayOfWeek.ENUM[day]] = value;
        }
        payload.body.business_hours = result;
    }

    const result = await salonRepository.update({
        payload: payload.body,
        criteria: { uuid },
    });

    if (result[0] === 0) {
        throw new error.BadRequest("Salon not updated");
    }

    return "Salon updated successfully";
};

exports.getAvailableSlots = async (payload) => {
    const { cart_id, start_date, days } = payload.query;

    // 1️⃣ Load cart
    let cart = await cartRepository.getCartByUuid(cart_id);
    if (!cart) throw new error.BadRequest("Cart not found");

    cart = cart.toJSON();
    const salon = cart.salon;
    if (!salon) throw new error.BadRequest("Salon not found");

    const cartItems = cart.cart_items.sort((a, b) => a.sequence - b.sequence);

    // 2️⃣ Validate duration
    const totalDuration = cartItems.reduce((acc, i) => acc + i.duration, 0);
    if (totalDuration !== cart.total_duration) {
        throw new error.BadRequest("Cart total duration mismatch");
    }

    // 3️⃣ Holidays
    const salonHolidays = await holidayRepository.getSalonHolidaysByDate(salon.id, start_date, days);

    const allStaffs = await staffRepository.findAll({
        criteria: { salon_id: salon.id },
    });
    const staffIds = allStaffs.map((s) => s.id);

    const staffHolidays = await holidayRepository.getStaffHolidaysByDate(staffIds, start_date, days);

    // 4️⃣ Staff by service (ALREADY NORMALIZED)
    const staffByService = await staffServiceRepository.getStaffByService({
        service_ids: cartItems.map((i) => i.service_id),
        salon_id: salon.id,
    });
    /**
     * staffByService = {
     *   1: [Staff, Staff],
     *   2: [Staff, Staff]
     * }
     */

    // 5️⃣ Existing bookings
    const bookingsByStaff = await bookingServiceRepository.getBookingsByStaff({
        salon_id: salon.id,
        start_date,
        days,
    });

    /** return of bookingsByStaff
     * {
     *   staffId: [{ start, end }]
     * }
     */

    const result = [];

    // 6️⃣ Iterate days
    for (let d = 0; d < days; d++) {
        const date = new Date(start_date);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        const dayOfWeek = date.getDay();

        if (salonHolidays.includes(dateStr)) continue;

        const businessHours = salon.business_hours?.[dayOfWeek];
        if (!businessHours?.start_time || !businessHours?.end_time) continue; // no business hours

        const dayStart = toMinutes(businessHours.start_time);
        const dayEnd = toMinutes(businessHours.end_time);

        const slots = [];

        // 7️⃣ Generate 15-min slots
        for (let slotStart = dayStart; slotStart + totalDuration <= dayEnd; slotStart += 15) {
            let offset = 0;
            let validSlot = true;
            const serviceOptions = [];

            // 8️⃣ Validate each service
            for (const cartItem of cartItems) {
                const serviceStart = slotStart + offset;
                const serviceEnd = serviceStart + cartItem.duration;
                offset += cartItem.duration;

                const staffList = staffByService[cartItem.service_id] || [];

                // Fixed staff
                if (cartItem.staff_id) {
                    const staff = staffList.find((s) => s.id === cartItem.staff_id);
                    if (!staff || !isStaffAvailable(staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff)) {
                        validSlot = false;
                        break;
                    }

                    serviceOptions.push({
                        service_id: cartItem.service_id,
                        staff_options: [staff.id],
                    });
                }
                else {
                    let assignedStaff = null;

                    for (const staff of staffList) {

                        if (
                            isStaffAvailable(
                                staff,
                                serviceStart,
                                serviceEnd,
                                dateStr,
                                staffHolidays,
                                bookingsByStaff
                            )
                        ) {
                            assignedStaff = staff;
                            break; // FIRST COME FIRST SERVE
                        }
                    }

                    // No staff available → slot invalid
                    if (!assignedStaff) {
                        validSlot = false;
                        break;
                    }

                    // mark staff as used for this slot
                    serviceOptions.push({
                        service_id: cartItem.service_id,
                        staff_id: assignedStaff.id
                    });
                }

            }

            // ✅ PUSH SLOT ONCE
            if (validSlot) {
                slots.push({
                    start: toISODateTime(dateStr, slotStart),
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

const isStaffAvailable = (staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff) => {
    //staff holidays
    if (staffHolidays.get(staff.id)?.has(dateStr)) {
        return false;
    }

    //ACtive hours
    const day = new Date(dateStr).getDay();

    const active = staff.active_hours[day];
    if (!active) {
        return false;
    }

    const activeStart = toMinutes(active.start_time);
    const activeEnd = toMinutes(active.end_time);

    if (serviceStart < activeStart || serviceEnd > activeEnd) {
        //not available
        return false;
    }

    //booking conflicts
    const staffBookings = bookingsByStaff[staff.id] || [];

    for (const booking of staffBookings) {
        if (serviceStart < booking.end && serviceEnd > booking.start) {
            return false; // overlap
        }
    }

    return true;
};
const toISODateTime = (dateStr, minutes) => {
    const d = new Date(dateStr);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCMinutes(minutes);
    return d.toISOString();
};

const toMinutes = (dateTime) => {
    const d = new Date(dateTime);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
};

const toTimeString = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
};

exports.listSalons = async (payload) => {
    let {
        page,
        limit ,
        search,
        category,
        latitude,
        longitude
    } = payload.query;

   const offset = (page && limit) ? (page - 1) * limit : 0;
    const where = {};
    const include = [];

    if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
    }

    if (category) {
        include.push({
            model: Category,
            as: 'categories',
            where: {
                name: { [Op.iLike]: `%${category}%` }
            },
            required: true
        });
    } else {
        include.push({
            model: Category,
            as: 'categories',
            required: false
        });
    }

    let attributes = undefined;
    let order = [['created_at', 'DESC']];

    if (latitude && longitude) {
        const distanceLiteral = sequelize.literal(
            `(6371 * acos(
                cos(radians(${latitude}))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(${longitude}))
                + sin(radians(${latitude}))
                * sin(radians(latitude))
            ))`
        );

        attributes = {
            include: [[distanceLiteral, 'distance']]
        };

        order = [[sequelize.literal('distance'), 'ASC']];
    }

    const { count, rows } = await salonRepository.findAndCountAll({
        criteria: where,
        include,
        offset,
        limit,
        attributes,
        order
    });

    return {
        total: count,
        page,
        limit,
        data: rows
    };
};

exports.getSalon = async (payload) => {
    const { uuid } = payload.params;
    console.log('uuid: ', uuid);

  const salon = await salonRepository.findByUuid(uuid);

    if (!salon) {
        throw new error.BadRequest("Salon not found");
    }

    return salon;
}



// exports.getAvailableSlots = async (payload) => {
//     const { cart_id, start_date, days } = payload.query;
//     console.log(cart_id, start_date, days);

//     // get cart
//     let cart = await cartRepository.getCardByUuid(cart_id);
//     cart = cart.toJSON();
//     if (!cart) {
//         throw new error.BadRequest("Cart not found");
//     }

//     // console.log("cart-------------------", cart.toJSON(), "-------------------");
//     const salon = cart.salon;
//     console.log("salon-------------------", salon, "-------------------");
//     if (!salon) {
//         throw new error.BadRequest("Salon not found");
//     }

//     const cartItems = cart.cart_items.sort((a, b) => a.sequence - b.sequence);
//     // console.log("services-------------------", services, "-------------------");

//     // calculate total duration
//     const totalDuration = cartItems.reduce((acc, service) => acc + service.duration, 0);

//     if (totalDuration != cart.total_duration) {
//         throw new error.BadRequest("Cart total duration not matched");
//     }

//     // console.log("totalDuration-------------------", totalDuration, "-------------------");

//     // get holidays
//     const salonHolidays = await holidayRepository.getSalonHolidaysByDate(salon.id,
//         start_date,
//         days);

//     const allStaffs = await staffRepository.findAll({ criteria: { salon_id: salon.id } });
//     const staffIds = allStaffs.map((staff) => staff.id);

//     const staffHolidays = await holidayRepository.getStaffHolidaysByDate(staffIds,
//         start_date,
//         days);

//     //load eligible staff per service
//     const serviceIds = cartItems.map((item) => item.service_id);
//     console.log("serviceIds-------------------", serviceIds, "-------------------");

//     const staffByService = await staffServiceRepository.getStaffByService({ service_ids: serviceIds, salon_id: salon.id })
//     /**   return of staffByService
//      * {
//      *   serviceId: [ staff, staff, ... ]
//      * }
//      */

//     //load existing bookings
//     const bookingsByStaff = await bookingServiceRepository.getBookingsByStaff({
//         salon_id: salon.id,
//         start_date,
//         days,
//     });

//     console.log("bookingsByStaff-------------------", bookingsByStaff, "-------------------");

//     /** return of bookingsByStaff
//          * {
//          *   staffId: [{ start, end }]
//          * }
//          */

//     const result = [];

//     //iterate over days

//     for (let d = 0; d < days; d++) {

//         const date = new Date(start_date);
//         date.setDate(date.getDate() + d);

//         const dateStr = date.toISOString().slice(0, 10);
//         const dayOfWeek = date.getDay(); //0-6
//         console.log("dayOfWeek-------------------", dayOfWeek, "-------------------");

//         //skip salon holiday
//         if (salonHolidays.includes(dateStr)) {
//             console.log("salon holiday-------------------");
//             continue;
//         }

//         // Skip if salon is closed that day
//         const businessHours = salon.business_hours?.[dayOfWeek];

//         if (!businessHours || !businessHours.start_time || !businessHours.end_time) {
//             // Salon not available on this day
//             continue;
//         }

//         const dayStart = toMinutes(businessHours.start_time);
//         const dayEnd = toMinutes(businessHours.end_time);

//         console.log("dayStart-------------------", businessHours.start_time, dayStart, "-------------------");
//         console.log("dayEnd-------------------", businessHours.end_time, dayEnd, "-------------------");
//         console.log("totalDuration-------------------", totalDuration, "-------------------");

//         const slots = [];

//         //generation of 15min slots

//         for (let slotStart = dayStart; slotStart + totalDuration <= dayEnd; slotStart += 15) {
//             let offSet = 0;
//             let validSlot = true;

//             const serviceOptions = [];

//             for (let cartItem of cartItems) {
//                 const serviceStart = slotStart + offSet;
//                 const serviceEnd = serviceStart + cartItem.duration;

//                 offSet += cartItem.duration;

//                 //             //fixed staff case
//                 if (cartItem.staff_id) {
//                     console.log("staffByService cartItem.service_id," + cartItem.service_id + "-------------------", staffByService, "-------------------");
//                     const staffList = staffByService[cartItem.service_id] || [];
//                     const staff = staffList.find(s => s.id === cartItem.staff_id);

//                     if (!staff) { //staff not found
//                         validSlot = false;
//                         break;
//                     }
//                     if (!isStaffAvailable(staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff)) {
//                         validSlot = false;
//                         break;
//                     }

//                     serviceOptions.push({
//                         staff_id: cartItem.service_id,
//                         staff_options: [staff.id]
//                     });

//                 } else {//random staff case
//                     //                 const candidates = staffByService[service.service_id].filter((staff) =>
//                     //                     this.isStaffAvailable(staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff));

//                     //                 if (!candidates || candidates.length === 0) { //no available staff
//                     //                     validSlot = false;
//                     //                     break;
//                     //                 }

//                     //                 serviceOptions.push({
//                     //                     staff_id: service.service_id,
//                     //                     staff_options: candidates.map((staff) => staff.id)
//                     //                 });

//                     //             }
//                 }

//             }
//             if (validSlot) {
//                 slots.push({
//                     start: toTimeString(slotStart),
//                     end: toTimeString(slotStart + totalDuration),
//                     serviceOptions
//                 });
//             }

//             if (slots.length > 0) {
//                 result.push({
//                     dateStr,
//                     slots
//                 });
//             }

//         }

//         return result;

//     }
// }



// Random staff
// else {
//     const candidates = staffList.filter((staff) =>
//         isStaffAvailable(staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff)
//     );

//     if (!candidates.length) {
//         validSlot = false;
//         break;
//     }

//     serviceOptions.push({
//         service_id: cartItem.service_id,
//         staff_options: candidates.map((s) => s.id),
//     });
// }

