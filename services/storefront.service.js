const {
  salonRepository,
  serviceRepository,
  staffRepository,
  staffServiceRepository,
} = require("../repository");
const { NotFound } = require("../libs/error");
const { formatStaffListTiming, formatStaffTiming } = require("../utils/staff-timing.util");

exports.getStorefrontProfile = async (payload) => {
  const { slug } = payload.params;

  if (!slug) {
    throw new NotFound("Storefront slug is required");
  }

  const salon = await salonRepository.findStorefrontProfileBySlug(slug.toLowerCase().trim());

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
      phone: salon.phone,
      email: salon.email,
      latitude: salon.latitude,
      longitude: salon.longitude,
      map_link: salon.map_link,
      allowed_payment_policies: salon.allowed_payment_policies,
      deposit_percentage: salon.deposit_percentage,
      has_stripe_account: Boolean(salon.stripe_account_id),
      theme: salon.storefrontTheme
        ? {
            id: salon.storefrontTheme.id,
            uuid: salon.storefrontTheme.uuid,
            code: salon.storefrontTheme.code,
            name: salon.storefrontTheme.name,
            preview_image: salon.storefrontTheme.preview_image,
          }
        : null,
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
  const { page = 1, limit = 10, category_id, search, gender } = payload.query || {};

  const salon = await salonRepository.findOne(
    { slug: slug.toLowerCase().trim(), is_active: true },
    [{ association: "categories" }]
  );

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { rows: services, count: total } = await serviceRepository.findAndCountStorefrontServices({
    salonId: salon.id,
    categoryId: category_id,
    search,
    gender,
    offset,
    limit: limitNum,
  });

  return {
    categories: salon.categories || [],
    services,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
    },
  };
};

exports.getStorefrontStaff = async (payload) => {
  const { slug } = payload.params;
  const { page = 1, limit = 10, search } = payload.query || {};

  const salon = await salonRepository.findOne({
    slug: slug.toLowerCase().trim(),
    is_active: true,
  });

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { rows: staffList, count: total } = await staffRepository.findAndCountStorefrontStaff({
    salonId: salon.id,
    search,
    offset,
    limit: limitNum,
  });

  return {
    staff: formatStaffListTiming(staffList),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
    },
  };
};

exports.getStorefrontServiceStaff = async (payload) => {
  const { slug, serviceUuid } = payload.params;
  const { query = {} } = payload;

  let salon = null;
  if (slug) {
    salon = await salonRepository.findBySlug(slug.toLowerCase().trim());
    if (!salon) {
      salon = await salonRepository.findOne({ uuid: slug });
    }
  }

  if (!salon && query?.salon_id) {
    salon = await salonRepository.findOne({ uuid: query.salon_id });
  }

  if (!salon) {
    throw new NotFound(`Salon '${slug || query?.salon_id}' not found or inactive`);
  }

  const service = await serviceRepository.findOne({
    uuid: serviceUuid,
    salon_id: salon.id,
  });

  if (!service) {
    throw new NotFound("Service not found");
  }

  const result = await staffServiceRepository.findStaffForServiceWithParentFallback({
    service,
    shouldIncludeParent: true,
    page: query?.page,
    limit: query?.limit,
  });

  result.data = result.data.map((item) => {
    if (item.staff) {
      item.staff = formatStaffTiming(item.staff);
    }
    return item;
  });

  return result;
};

exports.getStorefrontSubServices = async (payload) => {
  const { slug, serviceUuid } = payload.params;
  const { page = 1, limit = 10 } = payload.query || {};

  let salon = null;
  if (slug) {
    salon = await salonRepository.findBySlug(slug.toLowerCase().trim());
    if (!salon) {
      salon = await salonRepository.findOne({ uuid: slug });
    }
  }

  if (!salon) {
    throw new NotFound(`Salon '${slug}' not found or inactive`);
  }

  const parentService = await serviceRepository.findOne({
    uuid: serviceUuid,
    salon_id: salon.id,
    is_active: true,
  });

  if (!parentService) {
    throw new NotFound("Service not found");
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { rows: subServices, count: total } = await serviceRepository.findAndCountAll({
    criteria: {
      parent_id: parentService.id,
      salon_id: salon.id,
      is_active: true,
    },
    offset,
    limit: limitNum,
    order: [["created_at", "DESC"]],
  });

  return {
    subServices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
    },
  };
};
