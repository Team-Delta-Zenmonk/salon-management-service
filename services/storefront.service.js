const { salonRepository } = require("../repository");
const { NotFound } = require("../libs/error");

exports.getStorefrontProfile = async (payload) => {
  const { slug } = payload.params;

  if (!slug) {
    throw new NotFound("Storefront slug is required");
  }

  const salon = await salonRepository.findBySlug(slug.toLowerCase().trim());

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

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
      staff: salon.staff,
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
    staff: salon.staff || [],
  };
};
