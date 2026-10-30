const { serviceRepository, staffServiceRepository } = require("../repository");
const { error } = require("../libs");
const { Op, Sequelize } = require("sequelize");

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

const applySubServicePricingRules = (parent, targetPayload) => {
  if (!parent || !targetPayload) return targetPayload;

  if (parent.price_type === "free") {
    targetPayload.price_type = "free";
    targetPayload.price = 0;
    targetPayload.discount = 0;
    targetPayload.discount_type = null;
  } else if (parent.price_type === "fixed") {
    targetPayload.price_type = "fixed";
    targetPayload.price = parent.price;
  } else if (parent.price_type === "from") {
    targetPayload.price_type = "from";
    if (
      targetPayload.price !== undefined &&
      Number(targetPayload.price) < Number(parent.price)
    ) {
      throw new error.BadRequest(
        `Sub-service price must be at least ${parent.price} (parent minimum price)`
      );
    }
  }

  return targetPayload;
};

const syncSubServicesPricingFromParent = async (parentService, options = {}) => {
  if (!parentService || !parentService.id) return;

  const subServices = await serviceRepository.findAll({
    criteria: { parent_id: parentService.id },
    attributes: ["id"],
    transaction: options.transaction,
  });

  if (!subServices || subServices.length === 0) return;

  const subServiceIds = subServices.map((s) => s.id);
  const parentPriceType = parentService.price_type;
  const parentPrice = Number(parentService.price) || 0;

  if (parentPriceType === "free") {
    await serviceRepository.update({
      payload: {
        price_type: "free",
        price: 0,
        discount: 0,
        discount_type: null,
      },
      criteria: { id: { [Op.in]: subServiceIds } },
      options: { transaction: options.transaction },
    });

    await staffServiceRepository.update({
      payload: {
        price_type: "free",
        price: 0,
      },
      criteria: { service_id: { [Op.in]: subServiceIds } },
      options: { transaction: options.transaction },
    });
  } else if (parentPriceType === "fixed") {
    await serviceRepository.update({
      payload: {
        price_type: "fixed",
        price: parentPrice,
      },
      criteria: { id: { [Op.in]: subServiceIds } },
      options: { transaction: options.transaction },
    });

    await staffServiceRepository.update({
      payload: {
        price_type: "fixed",
        price: parentPrice,
      },
      criteria: { service_id: { [Op.in]: subServiceIds } },
      options: { transaction: options.transaction },
    });
  } else if (parentPriceType === "from") {
    await serviceRepository.update({
      payload: {
        price_type: "from",
        price: Sequelize.literal(`GREATEST(COALESCE(price, 0), ${parentPrice})`),
      },
      criteria: { id: { [Op.in]: subServiceIds } },
      options: { transaction: options.transaction },
    });

    await staffServiceRepository.update({
      payload: {
        price_type: "from",
        price: Sequelize.literal(`GREATEST(COALESCE(price, 0), ${parentPrice})`),
      },
      criteria: { service_id: { [Op.in]: subServiceIds } },
      options: { transaction: options.transaction },
    });
  }
};

module.exports = {
  hasSubServices,
  assertServiceBookable,
  assertServicesBookable,
  applySubServicePricingRules,
  syncSubServicesPricingFromParent,
};
