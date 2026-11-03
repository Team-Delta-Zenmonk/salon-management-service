const { error } = require("../libs");
const { Op } = require('sequelize');
const { sequelize } = require("../config/db/db-connection");
const { salonRepository, categoryRepository, serviceRepository, staffServiceRepository } = require("../repository");
const { applySubServicePricingRules, syncSubServicesPricingFromParent } = require("../utils/service-validation.util");

exports.createService = async (payload) => {
    const { body, salon } = payload;

    const { category_id, parent_id } = body;

    if (parent_id) {
        const parent = await serviceRepository.findOne({ uuid: parent_id, salon_id: salon.id });

        if (!parent) {
            throw new error.NotFound("Parent service not found");
        }

        body.parent_id = parent.id;
        applySubServicePricingRules(parent, body);

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
    const { category_uuid } = query || {};

    const page = Number(query?.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query?.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const offset = (page - 1) * limit;
    const search = query?.search;

    let criteria = {
      salon_id: salon.id,
      [Op.and]: [],
    };

      criteria.parent_id = null;

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

    const { count, rows } = await serviceRepository.findAndCountAll({
        criteria,
        attributes: {
            include: [
                [
                    sequelize.literal(
                        `(SELECT COUNT(*)::int FROM services AS child WHERE child.parent_id = "Service".id AND child.deleted_at IS NULL)`
                    ),
                    "sub_services_count",
                ],
            ],
        },
        include: ["category"],
        limit,
        offset,
        order: [["created_at", "DESC"]],
    });

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

    const shouldIncludeParent = query.include_parent !== undefined ? Boolean(query.include_parent) : false;

    return await staffServiceRepository.findStaffForServiceWithParentFallback({
        service,
        shouldIncludeParent,
        page: query?.page,
        limit: query?.limit,
    });
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
    const { params, salon, query } = payload;

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!service) {
        throw new error.NotFound("Service not found");
    }

    const page = Number(query?.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query?.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const offset = (page - 1) * limit;

    const options = {
        criteria: { parent_id: service.id },
        order: [["created_at", "DESC"]],
        limit,
        offset,
    };

    return await serviceRepository.findAndCountAll(options);
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

    if (service.parent_id) {
        const parent = await serviceRepository.findOne({ id: service.parent_id, salon_id: salon.id });
        if (parent) {
            applySubServicePricingRules(parent, updatePayload);
        }
    }

    return await sequelize.transaction(async (t) => {
        const response = await serviceRepository.update({
            payload: updatePayload,
            criteria: { uuid: params.uuid, salon_id: salon.id },
            options: { transaction: t },
        });

        if (response[0] !== 1) {
            throw new error.BadRequest('Failed to update service');
        }

        if (!service.parent_id && (updatePayload.price_type !== undefined || updatePayload.price !== undefined)) {
            const updatedParent = {
                id: service.id,
                price_type: updatePayload.price_type !== undefined ? updatePayload.price_type : service.price_type,
                price: updatePayload.price !== undefined ? updatePayload.price : service.price,
            };
            await syncSubServicesPricingFromParent(updatedParent, { transaction: t });
        }

        return { message: "Successfully updated service" };
    });
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