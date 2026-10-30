const {
  salonRepository,
  serviceRepository,
  staffRepository,
  staffServiceRepository,
} = require("../repository");
const { Op } = require("sequelize");
const { sequelize } = require("../config/db/db-connection");
const { NotFound } = require("../libs/error");
const { formatStaffListTiming, formatStaffTiming } = require("../utils/staff-timing.util");
const { isStaffInactive } = require("../utils/staff-status.util");

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
      totalPages: Math.ceil(total / limitNum),
      hasMore: offset + services.length < total,
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
      totalPages: Math.ceil(total / limitNum),
      hasMore: offset + staffList.length < total,
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

  const serviceIds = [service.id];
  if (service.parent_id) {
    serviceIds.push(service.parent_id);
  }

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const offset = (page - 1) * limit;

  const serviceIdsList = serviceIds.join(",");
  const todayStr = new Date().toISOString().split("T")[0];
  const activeStaffFilter = `
    JOIN staffs st ON st.id = staff_services.staff_id 
      AND st.deleted_at IS NULL 
      AND (
        st.end_date IS NULL 
        OR st.end_date = '' 
        OR (
          CASE 
            WHEN st.end_date ~ '^\\d{2}-\\d{2}-\\d{4}$' 
            THEN TO_DATE(st.end_date, 'DD-MM-YYYY') > '${todayStr}'::date
            ELSE st.end_date::date > '${todayStr}'::date
          END
        )
      )
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT staff_services.staff_id) AS total
    FROM staff_services
    ${activeStaffFilter}
    WHERE staff_services.service_id IN (${serviceIdsList}) AND staff_services.deleted_at IS NULL
  `;
  const [countResult] = await sequelize.query(countQuery);
  const total = Number(countResult?.[0]?.total || 0);

  const idsQuery = `
    SELECT staff_services.staff_id, MAX(staff_services.created_at) AS latest_created_at
    FROM staff_services
    ${activeStaffFilter}
    WHERE staff_services.service_id IN (${serviceIdsList}) AND staff_services.deleted_at IS NULL
    GROUP BY staff_services.staff_id
    ORDER BY latest_created_at DESC
    LIMIT :limit OFFSET :offset
  `;
  const [paginatedRows] = await sequelize.query(idsQuery, {
    replacements: { limit, offset },
  });

  const paginatedStaffIds = paginatedRows.map((r) => r.staff_id);

  if (paginatedStaffIds.length === 0) {
    return {
      total,
      page,
      limit,
      hasMore: false,
      data: [],
    };
  }

  const rows = await staffServiceRepository.findAll({
    criteria: {
      service_id: { [Op.in]: serviceIds },
      staff_id: { [Op.in]: paginatedStaffIds },
    },
    include: ["staff"],
    order: [["created_at", "DESC"]],
  });

  const uniqueMap = new Map();
  for (const item of rows) {
    const raw = typeof item.toJSON === "function" ? item.toJSON() : { ...item };
    if (!raw.staff || raw.staff.deleted_at || isStaffInactive(raw.staff)) {
      continue;
    }
    raw.staff = formatStaffTiming(raw.staff);
    const existing = uniqueMap.get(raw.staff_id);
    if (!existing || raw.service_id === service.id) {
      uniqueMap.set(raw.staff_id, raw);
    }
  }

  const data = paginatedStaffIds
    .map((staffId) => uniqueMap.get(staffId))
    .filter(Boolean);

  return {
    total,
    page,
    limit,
    hasMore: offset + data.length < total,
    data,
  };
};
