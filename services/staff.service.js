const { error } = require("../libs");
const { DayOfWeek } = require("../models/salon/salon-types");
const { staffRepository, staffServiceRepository, salonRepository } = require("../repository");
const { Op, fn, col, where: sequelizeWhere } = require("sequelize");
const { sequelize } = require("../config/db/db-connection");
const {
  formatStaffTiming,
  formatStaffListTiming,
} = require("../utils/staff-timing.util");

exports.create = async (payload) => {
  const { body, salon } = payload;

  if (body?.active_hours) {
    const result = {};
    for (const [day, value] of Object.entries(body.active_hours)) {
      result[DayOfWeek.ENUM[day]] = value;
    }

    body.active_hours = result;
  }

  return await staffRepository.create({
    ...body,
    salon_id: salon.id,
  });
};

exports.update = async (payload) => {
  const { body, salon, params } = payload;

  const staff = await staffRepository.findOne({
    uuid: params.uuid,
    salon_id: salon.id,
  });
  if (!staff) throw new error.NotFound("Staff not found");

  if (body?.end_date === "" || body?.end_date === null) {
    body.end_date = null;
  }

  if (body?.active_hours) {
    const result = {};
    for (const [day, value] of Object.entries(body.active_hours)) {
      result[DayOfWeek.ENUM[day]] = value;
    }

    body.active_hours = result;
  }

  const response = await staffRepository.update({
    payload: body,
    criteria: { uuid: params.uuid, salon_id: salon.id },
  });

  if (response[0] === 1) return { message: "Successfully updated staff" };

  throw new error.BadRequest("Failed to update staff");
};

exports.list = async (payload) => {
  const { salon, query } = payload;

  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const search = query?.search;

  const criteria = { salon_id: salon.id };

  if (search) {
    criteria[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },

      sequelizeWhere(fn("concat", col("first_name"), " ", col("last_name")), { [Op.iLike]: `%${search}%` }),
    ];
  }

  const staffs = await staffRepository.findAndCountAll({
    criteria,
    limit,
    offset: (page - 1) * limit,
    order: [["created_at", "DESC"]]
  });

  return {
    total: staffs.count,
    page,
    limit,
    data: formatStaffListTiming(staffs.rows),
  };
};

exports.get = async (payload) => {
  const { query, params } = payload;

  const salon = await salonRepository.findOne({ uuid: query.salon_id });
  if (!salon) throw new error.NotFound("Salon not found");

  const staff = await staffRepository.findOne({
    salon_id: salon.id,
    uuid: params.uuid,
  });

  return formatStaffTiming(staff);
};

exports.listServices = async (payload) => {
  const { params, salon, query = {} } = payload;

  const staff = await staffRepository.findOne({
    uuid: params.uuid,
    salon_id: salon.id,
  });
  if (!staff) throw new error.NotFound("Staff not found");

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await staffServiceRepository.findAndCountAll({
    criteria: { staff_id: staff.id },
    include: [
      {
        association: "service",
        attributes: {
          include: [
            [
              sequelize.literal(
                `(SELECT COUNT(*)::int FROM services AS child WHERE child.parent_id = "service".id AND child.deleted_at IS NULL)`
              ),
              "sub_services_count",
            ],
            [
              sequelize.literal(
                `(SELECT COUNT(DISTINCT child_ss.service_id)::int FROM staff_services AS child_ss JOIN services AS child_svc ON child_svc.id = child_ss.service_id WHERE child_svc.parent_id = "service".id AND child_svc.deleted_at IS NULL AND child_ss.staff_id = ${staff.id} AND child_ss.deleted_at IS NULL)`
              ),
              "assigned_sub_services_count",
            ],
          ],
        },
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  const formattedRows = rows.map((row) => {
    const raw = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
    if (raw.service) {
      const subCount = Number(raw.service.sub_services_count || 0);
      const assignedCount = Number(raw.service.assigned_sub_services_count || 0);
      const isParent = !raw.service.parent_id && subCount > 0;
      raw.service.is_partial = isParent && assignedCount > 0 && assignedCount < subCount;
      raw.service.is_full = !isParent || (assignedCount === subCount && subCount > 0);
    }
    return raw;
  });

  return {
    total: count,
    page,
    limit,
    data: formattedRows,
  };
};

exports.remove = async (payload) => {
  const { salon, params } = payload;

  const staff = await staffRepository.findOne({
    salon_id: salon.id,
    uuid: params.uuid,
  });
  if (!staff) throw new error.NotFound("Staff not found");

  await staffRepository.softDelete({
    salon_id: salon.id,
    uuid: params.uuid,
  });

  return { message: "Staff deleted successfully" };
};
