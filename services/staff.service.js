const { error } = require("../libs");
const { salonRepository, staffRepository, staffServiceRepository } = require("../repository");

exports.create = async (payload) => {
  const { body, salon } = payload;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
  if (!currentSalon) throw new error.NotFound("Salon not found");

  return await staffRepository.create({
    ...body,
    salon_id: currentSalon.id,
  });
};

exports.update = async (payload) => {
  const { body, salon, params } = payload;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
  if (!currentSalon) throw new error.NotFound("Salon not found");

  const staff = await staffRepository.findOne({
    uuid: params.uuid,
    salon_id: currentSalon.id,
  });
  if (!staff) throw new error.NotFound("Staff not found");

  const response = await staffRepository.update({
    payload: body,
    criteria: { uuid: params.uuid, salon_id: currentSalon.id },
  });

  if (response[0] === 1) return { message: "Successfully updated staff" };

  throw new error.BadRequest("Failed to update staff");
};

exports.list = async (payload) => {
  const { salon, query } = payload;
  const { page = 1, limit = 10 } = query;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
  if (!currentSalon) throw new error.NotFound("Salon not found");

  const staff = await staffRepository.findAndCountAll({
    criteria: { salon_id: currentSalon.id },
    limit: limit,
    offset: (page - 1) * limit,
  });
  return staff;
};

exports.get = async (payload) => {
  const { salon, params } = payload;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
  if (!currentSalon) throw new error.NotFound("Salon not found");

  const staff = await staffRepository.findOne({
    salon_id: currentSalon.id,
    uuid: params.uuid,
  });

  return staff;
};

exports.listServices = async (payload) => {
  const { params, salon } = payload;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });

  if (!currentSalon) {
    throw new error.NotFound("Salon not found");
  }

  const staff = await staffRepository.findOne({
    uuid: params.uuid,
    salon_id: currentSalon.id,
  });
  const services = await staffServiceRepository.findAll({
    criteria: { staff_id: staff.id },
  });
  return services;
};

exports.remove = async (payload) => {
  const { salon, params } = payload;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
  if (!currentSalon) throw new error.NotFound("Salon not found");
  
  const staff = await staffRepository.findOne({
    salon_id: currentSalon.id,
    uuid: params.uuid,
  });
  if (!staff) throw new error.NotFound("Staff not found");

  // check if cascade works for staff-service, and only delete if there are no bookings in future for this staff
  
  await staffRepository.softDelete({
    salon_id: currentSalon.id,
    uuid: params.uuid,
  });

  return { message: 'Staff deleted successfully' };;
};
