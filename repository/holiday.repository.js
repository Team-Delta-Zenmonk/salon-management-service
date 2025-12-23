const { Op } = require("sequelize");
const { Holiday } = require("../models");
const BaseRepository = require("./base.repository");
const { HolidayType } = require("../models/holiday/holiday-types");

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

    async getSalonHolidaysByDate(salonId, start_date, days) {
        const start = new Date(start_date);
        const end = new Date(start_date);
        end.setDate(end.getDate() + Number(days));

        const criteria = {
            holiday_type: HolidayType.ENUM.SALON,
            parent_id: salonId,
            holiday_date: {
                [Op.gte]: start,
                [Op.lt]: end,
            },
        };

        return await this.findAll({
            criteria,
            order: [["holiday_date", "ASC"]],
        });
    }

    // async getStaffHolidaysByDate(staffIds, start_date, days) {
    //     if (!Array.isArray(staffIds) || staffIds.length === 0) {
    //         return [];
    //     }

    //     const start = new Date(start_date);
    //     const end = new Date(start_date);
    //     end.setDate(end.getDate() + Number(days));

    //     const criteria = {
    //         holiday_type: HolidayType.ENUM.STAFF,
    //         parent_id: {
    //             [Op.in]: staffIds,
    //         },
    //         holiday_date: {
    //             [Op.gte]: start,
    //             [Op.lt]: end,
    //         },
    //     };

    //     return await this.findAll({
    //         criteria,
    //         order: [["holiday_date", "ASC"]],
    //     });
    // }

    async getStaffHolidaysByDate(staffIds, start_date, days) {
        if (!Array.isArray(staffIds) || staffIds.length === 0) {
            return new Map();
        }

        const start = new Date(start_date);
        const end = new Date(start_date);
        end.setDate(end.getDate() + Number(days));

        const rows = await this.findAll({
            criteria: {
                holiday_type: HolidayType.ENUM.STAFF,
                parent_id: {
                    [Op.in]: staffIds,
                },
                holiday_date: {
                    [Op.gte]: start,
                    [Op.lt]: end,
                },
            },
            order: [["holiday_date", "ASC"]],
        });

        // Normalize to Map<staffId, Set<dateStr>>
        const map = new Map();

        for (const row of rows) {
            const staffId = row.parent_id;
            const dateStr = row.holiday_date.toISOString().slice(0, 10);

            if (!map.has(staffId)) {
                map.set(staffId, new Set());
            }

            map.get(staffId).add(dateStr);
        }

        return map;
    }


}

module.exports = new HolidayRepository({ model: Holiday });
