const { Op } = require("sequelize");
const { StaffService, Staff } = require("../models");
const { sequelize } = require("../config/db/db-connection");
const { isStaffInactive } = require("../utils/staff-status.util");
const BaseRepository = require("./base.repository");
const { getActiveStaffLiteral } = require("../utils/staff-status.util");

class StaffServiceRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findStaffForServiceWithParentFallback({ service, shouldIncludeParent = false, page = 1, limit = 10 }) {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Math.min(Number(limit), 100) : 10;
    const offset = (pageNum - 1) * limitNum;

    const replacements = { serviceId: service.id, limit: limitNum, offset };
    let serviceCondition;

    if (service.parent_id && shouldIncludeParent) {
      replacements.parentId = service.parent_id;
      serviceCondition = `
        (
          (staff_services.service_id = :serviceId AND staff_services.deleted_at IS NULL)
          OR (
            staff_services.service_id = :parentId
            AND staff_services.deleted_at IS NULL
            AND staff_services.staff_id NOT IN (
              SELECT sub_ss.staff_id
              FROM staff_services sub_ss
              WHERE sub_ss.service_id = :serviceId
                AND sub_ss.deleted_at IS NOT NULL
            )
          )
        )
      `;
    } else {
      serviceCondition = `staff_services.service_id = :serviceId AND staff_services.deleted_at IS NULL`;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const activeStaffFilter = `
      JOIN staffs st ON st.id = staff_services.staff_id
        AND st.deleted_at IS NULL
        AND (
          st.end_date IS NULL
          OR st.end_date = ''
          OR (
            CASE
              WHEN st.end_date ~ '^\\d{2}-\\d{2}-\\d{4}$'
              THEN TO_DATE(st.end_date, 'DD-MM-YYYY') > '${todayStr}'::date
              ELSE st.end_date::date > '${todayStr}'::date
            END
          )
        )
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT staff_services.staff_id) AS total
      FROM staff_services
      ${activeStaffFilter}
      WHERE ${serviceCondition}
    `;
    const [countResult] = await sequelize.query(countQuery, { replacements });
    const total = Number(countResult?.[0]?.total || 0);

    const idsQuery = `
      SELECT staff_services.staff_id, MAX(staff_services.created_at) AS latest_created_at
      FROM staff_services
      ${activeStaffFilter}
      WHERE ${serviceCondition}
      GROUP BY staff_services.staff_id
      ORDER BY latest_created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    const [paginatedRows] = await sequelize.query(idsQuery, { replacements });

    const paginatedStaffIds = paginatedRows.map((r) => r.staff_id);

    if (paginatedStaffIds.length === 0) {
      return {
        total,
        page: pageNum,
        limit: limitNum,
        data: [],
      };
    }

    let criteria;
    if (service.parent_id && shouldIncludeParent) {
      const deletedRecords = await this.findAll({
        criteria: {
          service_id: service.id,
          deleted_at: { [Op.ne]: null },
        },
        paranoid: false,
        attributes: ["staff_id"],
      });
      const deletedStaffIdsOnService = deletedRecords.map((r) => r.staff_id);

      const parentStaffCriteria = {
        service_id: service.parent_id,
        staff_id: { [Op.in]: paginatedStaffIds.filter((id) => !deletedStaffIdsOnService.includes(id)) },
      };

      criteria = {
        [Op.or]: [
          {
            service_id: service.id,
            staff_id: { [Op.in]: paginatedStaffIds },
          },
          parentStaffCriteria,
        ],
      };
    } else {
      criteria = {
        service_id: service.id,
        staff_id: { [Op.in]: paginatedStaffIds },
      };
    }

    const rows = await this.findAll({
      criteria,
      include: ["staff"],
      order: [["created_at", "DESC"]],
    });

    const uniqueMap = new Map();
    for (const item of rows) {
      const raw = typeof item.toJSON === "function" ? item.toJSON() : { ...item };
      if (!raw.staff || raw.staff.deleted_at || isStaffInactive(raw.staff)) {
        continue;
      }
      const existing = uniqueMap.get(raw.staff_id);
      if (!existing || raw.service_id === service.id) {
        uniqueMap.set(raw.staff_id, raw);
      }
    }

    const data = paginatedStaffIds
      .map((staffId) => uniqueMap.get(staffId))
      .filter(Boolean);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      data,
    };
  }

  async getStaffByService({ service_ids, salon_id }) {
    const rows = await this.findAll({
      criteria: {
        service_id: {
          [Op.in]: service_ids,
        },
      },
      include: [
        {
          model: Staff,
          as: "staff",
          where: {
            salon_id,
            [Op.and]: [getActiveStaffLiteral()],
          },
          required: true,
        },
      ],
    });
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

  async findByServiceAndStaff(pairs) {
    if (!pairs || pairs.length === 0) return [];
    
    const criteria = {
      [Op.or]: pairs.map(pair => ({
        service_id: pair.service_id,
        staff_id: pair.staff_id
      }))
    };
    
    return await this.findAll({ criteria });
  }
}

module.exports = new StaffServiceRepository({ model: StaffService });
