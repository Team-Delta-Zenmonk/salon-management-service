const { error } = require("../libs");
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

exports.listStaff = async(payload) => {
    const { params, salon } = payload;

    const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });

    if (!currentSalon) {
        throw new error.NotFound("Salon not found");
    }

    const service = await serviceRepository.findOne({uuid: params.uuid, salon_id: currentSalon.id});

    const staffs = await staffServiceRepository.findAll({criteria: {service_id: service.id}});
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

exports.listServicesByCategory = async (payload) => {
    const { params, salon } = payload;
    
    const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!category) {
        throw new error.NotFound("Category not found");
    }

    return await serviceRepository.findAndCountAll({ criteria: { category_id: category.id } });
}

exports.updateService = async (payload) => {
    const { params, salon, body } = payload;

    const service = await serviceRepository.findOne({ uuid: params.uuid, salon_id: salon.id });

    if (!service) {
        throw new error.NotFound("Service not found");
    }

    const response = await serviceRepository.update({
        payload: body,
        criteria: { uuid: params.uuid },
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