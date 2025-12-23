const { Op } = require("sequelize");
const { StaffService, Staff } = require("../models");
const BaseRepository = require("./base.repository");

class StaffServiceRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }

    async getStaffByService({ service_ids, salon_id }) {
        const rows = await this.findAll({
            criteria: {
                service_id: {
                    [Op.in]: service_ids,
                },
            }, include: [
                {
                    model: Staff,
                    as: "staff",
                    where: { salon_id }, required: true
                }
            ]
        })
        const map = {};

        for (const row of rows) {
            const serviceId = row.service_id;

            if (!map[serviceId]) {
                map[serviceId] = [];
            }

            map[serviceId].push(row.staff);
        }

        return map;
    }
}

module.exports = new StaffServiceRepository({ model: StaffService });
