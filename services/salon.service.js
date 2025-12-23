const { DayOfWeek } = require("../models/salon/salon-types");
const { salonRepository , cartRepository} = require("../repository");
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

    return await salonRepository.update({
        payload: payload.body,
        criteria: { uuid }
    });
}

// exports.getAvailableSlots = async (payload) => {
//     const { cart_id, start_date, days = 1 } = payload.query;

//     const cart = await cartRepository.findOne(
//         { cart_id },
//         ['cart_items']
//     );

//     if (!cart) throw new Error('Cart not found');

//     const services = [];

//     for (const item of cart.cart_items) {
//         const service = await getService(item.service_id);

//         let staffIds = [];

//         if (item.staff_id) {
//             staffIds = [item.staff_id];
//         } else {
//             const staff = await getEligibleStaff(item.service_id);
//             staffIds = staff.map(s => s.staff_id);
//         }

//         services.push({
//             service_id: item.service_id,
//             duration: service.duration_minutes,
//             staffIds
//         });
//     }

//     const response = {};
//     const start = new Date(start_date);

//     for (let d = 0; d < days; d++) {
//         const date = new Date(start);
//         date.setDate(start.getDate() + d);

//         const staffCalendars = {};
//         const staffSet = new Set(
//             services.flatMap(s => s.staffIds)
//         );

//         for (const staffId of staffSet) {
//             staffCalendars[staffId] = await getStaffCalendar(staffId, date);
//         }

//         const slots = await findSlotsForDay(
//             services,
//             staffCalendars,
//             9 * 60,
//             18 * 60
//         );

//         response[date.toISOString().split('T')[0]] =
//             slots.map(m => {
//                 const h = Math.floor(m / 60);
//                 const min = m % 60;
//                 return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
//             });
//     }

//     return response;
// };


// async function loadStaffWorkingHours(staffId, date) {
//     // Example response expected from DB
//     // [{ start: "09:00", end: "18:00" }]

//     const rows = await staffWorkingHourRepository.getForDate(staffId, date);

//     return rows.map(r => ({
//         start: minutes(...r.start.split(':')),
//         end: minutes(...r.end.split(':'))
//     }));
// }

// async function loadStaffBookings(staffId, date) {
//     const bookings = await bookingRepository.getForStaffDate(staffId, date);

//     return bookings.map(b => ({
//         start: toMinutesFromDate(new Date(b.start_datetime)),
//         end: toMinutesFromDate(new Date(b.end_datetime))
//     }));
// }

// async function loadStaffTimeOff(staffId, date) {
//     const leaves = await staffTimeOffRepository.getForStaffDate(staffId, date);

//     return leaves.map(l => ({
//         start: toMinutesFromDate(new Date(l.start_datetime)),
//         end: toMinutesFromDate(new Date(l.end_datetime))
//     }));
// }



exports.getAvailableSlots = async (payload) => {
    const { cart_id, start_date, days = 1 } = payload.query;

    const cart = await cartRepository.findOne(
        { cart_id },
        ['cart_items']
    );

    if (!cart) throw new Error('Cart not found');
    const normalizedCart = await exports.normalizeCart(cart);


};

exports.listSalons = async (payload) => {
    let { page = 1, limit = 10, search, category, latitude, longitude, range = 10 } = payload.query;
    
    const offset = (page - 1) * limit;

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

    let order = [['created_at', 'DESC']];
    let attributes = undefined;
    
    if (latitude && longitude) {
        const latRange = range / 111;
        const minLat = latitude - latRange;
        const maxLat = latitude + latRange;

        const radLat = latitude * (Math.PI / 180);
        const lonRange = range / (111 * Math.cos(radLat));
        
        const minLon = longitude - lonRange;
        const maxLon = longitude + lonRange;

        where.latitude = { [Op.between]: [minLat, maxLat] };
        where.longitude = { [Op.between]: [minLon, maxLon] };

        const distanceLiteral = sequelize.literal(
          `(6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(longitude)
           - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude))))`
        );

        attributes = {
            include: [
                [distanceLiteral, 'distance']
            ]
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
}
