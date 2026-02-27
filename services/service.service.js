const { error } = require("../libs");
const { Op } = require('sequelize');
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
        // body.category_id = parent.category_id;

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

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const offset = query?.offset !== undefined ? Number(query.offset) : (page - 1) * limit;
    const search = query.search;

    let criteria = { salon_id: salon.id };

    if (search) {
      criteria[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category_uuid) {
        const category = await categoryRepository.findOne({ uuid: category_uuid, salon_id: salon.id });
        if (!category) {
            throw new error.NotFound("Category not found");
        }
        criteria.category_id = category.id;
    }

    const { count, rows } = await serviceRepository.findAndCountAll({ criteria, include: ["category"], limit, offset });

    return {
        total: count,
        page,
        limit,
        data: rows
    };
}

exports.listStaff = async (payload) => {
    const { params, query } = payload;

    const salon = await salonRepository.findOne({ uuid: query.salon_id });
    if (!salon) throw new error.NotFound("Salon not found");

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
    if (!service) throw new error.NotFound("Service not found");

    const staffs = await staffServiceRepository.findAll({ criteria: { service_id: service.id },include: ["staff"] });
    return staffs;
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

    await serviceRepository.softDelete({ uuid: params.uuid });

    return { message: 'Service deleted successfully' };
}