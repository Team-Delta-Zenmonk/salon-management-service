const { serviceRepository } = require("../repository");
const { error } = require("../libs");
const { Op } = require("sequelize");

const hasSubServices = async (serviceId) => {
  if (!serviceId) return false;
  const child = await serviceRepository.findOne(
    { parent_id: serviceId },
    [],
    { attributes: ["id"] },
  );
  return Boolean(child);
};

const assertServiceBookable = async (service, action = "booked") => {
  if (!service) return;
  if (service.parent_id) return;

  const isParent = await hasSubServices(service.id);
  if (isParent) {
    throw new error.BadRequest(
      `Parent service '${service.name}' cannot be ${action} directly. Please select a specific sub-service.`
    );
  }
};

const assertServicesBookable = async (services, action = "booked") => {
  if (!Array.isArray(services) || services.length === 0) return;

  const rootServices = services.filter((s) => !s.parent_id);
  if (rootServices.length === 0) return;

  const rootIds = rootServices.map((s) => s.id);
  const childMatches = await serviceRepository.findAll({
    criteria: {
      parent_id: { [Op.in]: rootIds },
    },
    attributes: ["parent_id"],
    subQuery: false,
  });

  if (childMatches && childMatches.length > 0) {
    const parentIdSet = new Set(childMatches.map((c) => c.parent_id));
    const offendingService = rootServices.find((s) => parentIdSet.has(s.id));
    if (offendingService) {
      throw new error.BadRequest(
        `Parent service '${offendingService.name}' cannot be ${action} directly. Please select a specific sub-service.`
      );
    }
  }
};

module.exports = {
  hasSubServices,
  assertServiceBookable,
  assertServicesBookable,
};
