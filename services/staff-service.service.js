const { error } = require("../libs");
const { salonRepository, staffServiceRepository, staffRepository, serviceRepository } = require("../repository");

exports.bulkCreate = async (payload) => {
  const { body, salon } = payload;

  const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
  if (!currentSalon) throw new error.NotFound("Salon not found");

  const serviceUUIDs = [...new Set(body.map(i => i.service_uuid))];
  const staffUUIDs = [...new Set(body.map(i => i.staff_uuid))];

  const services = await serviceRepository.findAll({
    criteria: { uuid: serviceUUIDs },
    attributes: ["id", "uuid"]
  });

  const staff = await staffRepository.findAll({
    criteria: { uuid: staffUUIDs },
    attributes: ["id", "uuid"]
  });

  const serviceMap = new Map(services.map(s => [s.uuid, s.id]));
  const staffMap = new Map(staff.map(s => [s.uuid, s.id]));

  const finalData = body.map(item => {
    const service_id = serviceMap.get(item.service_uuid);
    const staff_id = staffMap.get(item.staff_uuid);

    if (!service_id || !staff_id) {
      throw new Error(`Invalid service_uuid or staff_uuid in payload`);
    }

    return {
      service_id,
      staff_id,
      duration: item.duration,
      priceType: item.priceType,
      price: item.price,
    };
  });

  return await staffServiceRepository.createBulk(finalData, {
    conflictAttributes: ["service_id", "staff_id"],
    updateOnDuplicate: ["duration", "priceType", "price"],
    transaction
  });
};
