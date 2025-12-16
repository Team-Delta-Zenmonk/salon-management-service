const { DayOfWeek } = require("../models/salon/salon-types");
const { salonRepository } = require("../repository");
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

exports.getAvailableSlots = async (payload) => {
    const { cart_id, start_date, days } = payload.query;
    console.log(cart_id, start_date, days);
    return {};
}

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
