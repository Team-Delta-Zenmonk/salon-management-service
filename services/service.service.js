const { error } = require("../libs");
const { Op } = require('sequelize');
const { sequelize } = require("../config/db/db-connection");
const { salonRepository, categoryRepository, serviceRepository, staffServiceRepository } = require("../repository");

exports.createService = async (payload) => {
    const { body, salon } = payload;

    const { category_id, parent_id } = body;

    if (parent_id) {
        const parent = await serviceRepository.findOne({ uuid: parent_id, salon_id: salon.id });

        if (!parent) {
            throw new error.NotFound("Parent service not found");
        }

        body.parent_id = parent.id;

        return await serviceRepository.create({ ...body, salon_id: salon.id, category_id: null });

    }

    const category = await categoryRepository.findOne({ uuid: category_id, salon_id: salon.id });

    if (!category) {
        throw new error.NotFound("Category not found");
    }

    return await serviceRepository.create({ ...body, salon_id: salon.id, category_id: category.id });
}

exports.listServices = async (payload) => {
    const { query, salon } = payload;
    const { category_uuid, include_sub_services } = query || {};

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const offset = query?.offset !== undefined ? Number(query.offset) : (page - 1) * limit;
    const search = query?.search;

    const shouldIncludeSubServices =
      include_sub_services === true ||
      include_sub_services === "true" ||
      include_sub_services === 1 ||
      include_sub_services === "1";

    let criteria = {
      salon_id: salon.id,
      [Op.and]: [],
    };

    if (!shouldIncludeSubServices) {
      criteria.parent_id = null;
    }

    if (search) {
      const sanitizedSearch = search.replace(/'/g, "''");
      criteria[Op.and].push({
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          {
            id: {
              [Op.in]: sequelize.literal(
                `(SELECT parent_id FROM services WHERE parent_id IS NOT NULL AND deleted_at IS NULL AND (name ILIKE '%${sanitizedSearch}%' OR (description IS NOT NULL AND description ILIKE '%${sanitizedSearch}%')))`
              ),
            },
          },
        ],
      });
    }

    if (category_uuid) {
        const category = await categoryRepository.findOne({ uuid: category_uuid, salon_id: salon.id });
        if (!category) {
            throw new error.NotFound("Category not found");
        }
        criteria.category_id = category.id;
    }

    const { count, rows } = await serviceRepository.findAndCountAll({ criteria, include: ["category"], limit, offset ,order: [["created_at", "DESC"]]});

    return {
        total: count,
        page,
        limit,
        data: rows
    };
}

exports.listStaff = async (payload) => {
    const { params, query } = payload;

    const salonUuid = query.salon_uuid || query.salon_id;
    const salon = await salonRepository.findOne({ uuid: salonUuid });
    if (!salon) throw new error.NotFound("Salon not found");

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
    if (!service) throw new error.NotFound("Service not found");

    let serviceIds = [service.id];
    const shouldIncludeParent = query.include_parent !== undefined ? Boolean(query.include_parent) : false;
    if (service.parent_id && shouldIncludeParent) {
        serviceIds.push(service.parent_id);
    }

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const offset = query.offset !== undefined ? Number(query.offset) : (page - 1) * limit;

    const serviceIdsList = serviceIds.join(",");
    const countQuery = `
        SELECT COUNT(DISTINCT staff_id) AS total
        FROM staff_services
        WHERE service_id IN (${serviceIdsList}) AND deleted_at IS NULL
    `;
    const [countResult] = await sequelize.query(countQuery);
    const total = Number(countResult?.[0]?.total || 0);

    const idsQuery = `
        SELECT staff_id, MAX(created_at) AS latest_created_at
        FROM staff_services
        WHERE service_id IN (${serviceIdsList}) AND deleted_at IS NULL
        GROUP BY staff_id
        ORDER BY latest_created_at DESC
        LIMIT :limit OFFSET :offset
    `;
    const [paginatedRows] = await sequelize.query(idsQuery, {
        replacements: { limit, offset }
    });

    const paginatedStaffIds = paginatedRows.map((r) => r.staff_id);

    if (paginatedStaffIds.length === 0) {
        return {
            total,
            page,
            limit,
            data: [],
        };
    }

    const rows = await staffServiceRepository.findAll({
        criteria: {
            service_id: { [Op.in]: serviceIds },
            staff_id: { [Op.in]: paginatedStaffIds }
        },
        include: ["staff"],
        order: [["created_at", "DESC"]],
    });

    const uniqueMap = new Map();
    for (const item of rows) {
        const existing = uniqueMap.get(item.staff_id);
        if (!existing || item.service_id === service.id) {
            uniqueMap.set(item.staff_id, item);
        }
    }

    const data = paginatedStaffIds
        .map((staffId) => uniqueMap.get(staffId))
        .filter(Boolean);

    return {
        total,
        page,
        limit,
        data,
    };
}

exports.getService = async (payload) => {
    const { params, salon } = payload;

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!service) {
        throw new error.NotFound("Service not found");
    }

    return service;
}

exports.listSubServices = async (payload) => {
    const { params, salon } = payload;

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!service) {
        throw new error.NotFound("Service not found");
    }

    return await serviceRepository.findAndCountAll({ criteria: { parent_id: service.id } });
}

exports.updateService = async (payload) => {
    const { params, salon, body } = payload;

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!service) {
        throw new error.NotFound("Service not found");
    }

    const updatePayload = { ...body };

    if (body.category_id) {
        const category = await categoryRepository.findOne({ uuid: body.category_id, salon_id: salon.id, });

        if (!category) {
            throw new error.NotFound("Category not found");
        }

        updatePayload.category_id = category.id;
    } else {
        delete updatePayload.category_id;
    }

    const response = await serviceRepository.update({
        payload: updatePayload,
        criteria: { uuid: params.uuid, salon_id: salon.id },
    });

    if (response[0] === 1) return { message: "Successfully updated service" }

    throw new error.BadRequest('Failed to update service');
}

exports.deleteService = async (payload) => {
    const { params, salon } = payload;

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!service) {
        throw new error.NotFound("Service not found");
    }

    const subServices = await serviceRepository.findAll({
        criteria: { parent_id: service.id },
        paranoid: false,
    });
    const targetIds = [service.id, ...subServices.map((s) => s.id)];

    await staffServiceRepository.destroy({
        criteria: { service_id: { [Op.in]: targetIds } },
        options: { force: true },
    });

    await serviceRepository.destroy({
        criteria: {
            [Op.or]: [
                { uuid: params.uuid },
                { parent_id: service.id },
            ],
        },
        options: { force: true },
    });

    return { message: 'Service deleted successfully' };
}