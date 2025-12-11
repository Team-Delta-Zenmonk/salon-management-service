const { Op } = require("sequelize");
const { Holiday } = require("../models");
const BaseRepository = require("./base.repository");

class HolidayRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }

    async listHolidays({ criteria, limit, page }) {
        const offset = (page - 1) * limit;
        const include = [];
        const order_column = 'updated_at'
        const order = [[order_column, 'DESC']];

        const count = await this.count({ where: criteria });
        const rows = await this.findAll({ criteria, include, offset, limit, order });

        return { count, rows };
    }

    addHolidayDateFilter(criteria, year, month) {

        // Use current year if user gives only month
        const currentYear = new Date().getFullYear();

        // No filters
        if (!year && !month) return criteria;

        // year + month
        if (year && month) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 1);

            criteria.holiday_date = {
                [Op.gte]: start,
                [Op.lt]: end,
            };
            return criteria;
        }

        // Only year
        if (year && !month) {
            const start = new Date(year, 0, 1);
            const end = new Date(year + 1, 0, 1);

            criteria.holiday_date = {
                [Op.gte]: start,
                [Op.lt]: end,
            };
            return criteria;
        }

        // Only month → assume current year
        if (!year && month) {
            const start = new Date(currentYear, month - 1, 1);
            const end = new Date(currentYear, month, 1);

            criteria.holiday_date = {
                [Op.gte]: start,
                [Op.lt]: end,
            };
            return criteria;
        }

        return criteria;
    }

}

module.exports = new HolidayRepository({ model: Holiday });
