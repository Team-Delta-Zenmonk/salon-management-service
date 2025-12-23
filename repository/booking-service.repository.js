const { Op } = require("sequelize");
const { BookingService, Booking } = require("../models");
const BaseRepository = require("./base.repository");

class BookingServiceRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }

    async getBookingsByStaff({ salon_id, start_date, days }) {
        const start = new Date(start_date);
        const end = new Date(start_date);
        end.setDate(end.getDate() + Number(days));

        const rows = await this.model.findAll({
            attributes: ["staff_id", "start_time", "end_time"],
            include: [
                {
                    model: Booking,
                    as: "booking",
                    attributes: [],
                    required: true,
                    where: {
                        salon_id,
                        booking_date: {
                            [Op.gte]: start,
                            [Op.lt]: end,
                        },
                        // OPTIONAL (recommended)
                        // status: BookingStatus.ENUM.CONFIRMED
                    },
                },
            ],
            where: {
                start_time: {
                    [Op.gte]: start,
                    [Op.lt]: end,
                },
            },
            order: [["start_time", "ASC"]],
            raw: true,
        });

        /**
         * {
         *   staffId: [{ start, end }]
         * }
         */
        const bookingsByStaff = {};

        for (const row of rows) {
            const staffId = row.staff_id;

            if (!bookingsByStaff[staffId]) {
                bookingsByStaff[staffId] = [];
            }

            bookingsByStaff[staffId].push({
                start: new Date(row.start_time),
                end: new Date(row.end_time),
            });
        }

        return bookingsByStaff;
    }
}

module.exports = new BookingServiceRepository({ model: BookingService });
