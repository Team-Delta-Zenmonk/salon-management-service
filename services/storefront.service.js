const {
  salonRepository,
  serviceRepository,
  staffServiceRepository,
} = require("../repository");
const { Op } = require("sequelize");
const { NotFound } = require("../libs/error");
const { formatStaffListTiming, formatStaffTiming } = require("../utils/staff-timing.util");

exports.getStorefrontProfile = async (payload) => {
  const { slug } = payload.params;

  if (!slug) {
    throw new NotFound("Storefront slug is required");
  }

  const salon = await salonRepository.findBySlug(slug.toLowerCase().trim());

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

  const formattedStaff = formatStaffListTiming(salon.staff);

  return {
    salon: {
      uuid: salon.uuid,
      name: salon.name,
      slug: salon.slug,
      about: salon.about,
      type: salon.type,
      logo: salon.logo,
      photos: salon.photos,
      business_hours: salon.business_hours,
      address: salon.address,
      latitude: salon.latitude,
      longitude: salon.longitude,
      map_link: salon.map_link,
      allowed_payment_policies: salon.allowed_payment_policies,
      deposit_percentage: salon.deposit_percentage,
      is_accepting_bookings:
        salon.is_active !== false &&
        salon.subscription_status !== "expired" &&
        salon.subscription_status !== "suspended",
      categories: salon.categories,
      services: salon.services,
      staff: formattedStaff,
      holidays: salon.holidays,
    },
  };
};

exports.getStorefrontServices = async (payload) => {
  const { slug } = payload.params;
  const salon = await salonRepository.findBySlug(slug.toLowerCase().trim());

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

  return {
    categories: salon.categories || [],
    services: salon.services || [],
  };
};

exports.getStorefrontStaff = async (payload) => {
  const { slug } = payload.params;
  const salon = await salonRepository.findBySlug(slug.toLowerCase().trim());

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

  return {
    staff: formatStaffListTiming(salon.staff),
  };
};

exports.getStorefrontServiceStaff = async (payload) => {
  const { slug, serviceUuid } = payload.params;

  let salon = null;
  if (slug) {
    salon = await salonRepository.findBySlug(slug.toLowerCase().trim());
    if (!salon) {
      salon = await salonRepository.findOne({ uuid: slug });
    }
  }

  if (!salon && payload.query?.salon_id) {
    salon = await salonRepository.findOne({ uuid: payload.query.salon_id });
  }

  if (!salon) {
    throw new NotFound(`Salon '${slug || payload.query?.salon_id}' not found or inactive`);
  }

  const service = await serviceRepository.findOne({
    uuid: serviceUuid,
    salon_id: salon.id,
  });

  if (!service) {
    throw new NotFound("Service not found");
  }

  const serviceIds = [service.id];
  if (service.parent_id) {
    serviceIds.push(service.parent_id);
  }

  const staffServices = await staffServiceRepository.findAll({
    criteria: { service_id: { [Op.in]: serviceIds } },
    include: ["staff"],
  });

  return staffServices.map((row) => {
    const raw = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
    if (raw.staff) {
      raw.staff = formatStaffTiming(raw.staff);
    }
    return raw;
  });
};
