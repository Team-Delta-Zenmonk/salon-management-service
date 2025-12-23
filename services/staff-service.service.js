const { error } = require("../libs");
const {
  salonRepository,
  staffServiceRepository,
  staffRepository,
  serviceRepository,
} = require("../repository");

exports.bulkCreate = async (payload) => {
  return await staffServiceRepository.handleManagedTransaction(
    async (transaction) => {
      const { body } = payload;

      const serviceUUIDs = [...new Set(body.staff_services.map((i) => i.service_uuid))];
      const staffUUIDs = [...new Set(body.staff_services.map((i) => i.staff_uuid))];

      const services = await serviceRepository.findAll({
        criteria: { uuid: serviceUUIDs },
        attributes: ["id", "uuid"],
        transaction
      });

      const staff = await staffRepository.findAll({
        criteria: { uuid: staffUUIDs },
        attributes: ["id", "uuid"],
        transaction
      });

      const serviceMap = new Map(services.map((s) => [s.uuid, s.id]));
      const staffMap = new Map(staff.map((s) => [s.uuid, s.id]));

      const finalData = body.staff_services.map((item) => {
        const service_id = serviceMap.get(item.service_uuid);
        const staff_id = staffMap.get(item.staff_uuid);

        if (!service_id || !staff_id) {
          throw new Error(`Invalid service_uuid or staff_uuid in payload`);
        }

        return {
          service_id,
          staff_id,
          duration: item.duration,
          price_type: item.price_type,
          price: item.price,
        };
      });

      const staffServices = await staffServiceRepository.createBulk(finalData, {
        conflictAttributes: ["service_id", "staff_id"],
        updateOnDuplicate: ["duration", "price_type", "price"],
        transaction,
      });

      return {
        staff_services: staffServices
      }
    }
  );
};
exports.unassignStaffService = async (payload) => {
  const { params } = payload;
  const { staff_uuid, service_uuid } = params;

  const staff = await staffRepository.findOne({ uuid: staff_uuid });
  if (!staff) {
    throw new error.NotFound("Staff not found");
  }

  const service = await serviceRepository.findOne({ uuid: service_uuid });
  if (!service) {
    throw new error.NotFound("Service not found");
  }

  const staffService = await staffServiceRepository.findOne({
    staff_id: staff.id,
    service_id: service.id
  });

  if (!staffService) {
    throw new error.NotFound("Staff is not assigned to this service");
  }

  await staffServiceRepository.softDelete({ id: staffService.id }, { force: true });

  return { message: "Staff unassigned from service successfully" };
};
