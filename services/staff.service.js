const { error } = require("../libs");
const { DayOfWeek } = require("../models/salon/salon-types");
const { staffRepository, staffServiceRepository, salonRepository } = require("../repository");
const { Op, fn, col, where: sequelizeWhere } = require("sequelize");

const numberToDay = Object.fromEntries(Object.entries(DayOfWeek.ENUM).map(([day, num]) => [num, day]));

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

  const updatedStaffs = staffs.rows.map((staff) => {
    if (staff?.active_hours) {
      const result = {};
      for (const [num, value] of Object.entries(staff.active_hours)) {
        result[numberToDay[num]] = value;
      }
      staff.active_hours = result;
    }
    return staff;
  });

  return {
    total: staffs.count,
    page,
    limit,
    data: updatedStaffs,
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

  if (staff?.active_hours) {
    const result = {};
    for (const [num, value] of Object.entries(staff.active_hours)) {
      result[numberToDay[num]] = value;
    }
    staff.active_hours = result;
  }
  return staff;
};

exports.listServices = async (payload) => {
  const { params, salon } = payload;

  const staff = await staffRepository.findOne({
    uuid: params.uuid,
    salon_id: salon.id,
  });
  const services = await staffServiceRepository.findAll({
    criteria: { staff_id: staff.id },
  });
  return services;
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
