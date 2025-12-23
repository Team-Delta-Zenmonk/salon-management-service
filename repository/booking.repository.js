const { Op } = require("sequelize");
const { Booking } = require("../models");
const BaseRepository = require("./base.repository");

class BookingRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }

    async getBookingsByDate(salon_id, start_date, days) {
        const start = new Date(start_date);
        const end = new Date(start_date);
        end.setDate(end.getDate() + Number(days));

        const criteria = {
            salon_id,
            booking_date: {
                [Op.gte]: start,
                [Op.lt]: end,
            },
        };

        return await this.findAll({
            criteria,
            order: [["booking_start_time", "ASC"]],
            include: [
                {
                    association: "booking_services",
                },
            ],
        });
    }
}

module.exports = new BookingRepository({ model: Booking });
