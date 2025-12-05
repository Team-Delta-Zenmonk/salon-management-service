const { error } = require('../libs');
const { salonRepository, categoryRepository } = require("../repository");

exports.createCategory = async (payload) => {
    const { body, salon } = payload;

    const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
    if (!currentSalon) throw new error.NotFound('Salon not found');

    return await categoryRepository.create({
        ...body,
        salon_id: currentSalon.id,
    });

}

exports.getCategories = async (payload) => {
    const { salon } = payload;

    const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
    if (!currentSalon) throw new error.NotFound('Salon not found');

    return await categoryRepository.findAndCountAll({ criteria: { salon_id: currentSalon.id } });
}

exports.updateCategory = async (payload) => {
    const { body, salon, params } = payload;

    const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
    if (!currentSalon) throw new error.NotFound('Salon not found');

    const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: currentSalon.id });
    if (!category) throw new error.NotFound('Category not found');

    const response = await categoryRepository.update({
        payload: body,
        criteria: { uuid: params.uuid },
    });

    if (response[0] === 1) return { message: "Successfully updated category" }

    throw new error.BadRequest('Failed to update category');
}

exports.deleteCategory = async (payload) => {
    const { salon, params } = payload;

    const currentSalon = await salonRepository.findOne({ uuid: salon.uuid });
    if (!currentSalon) throw new error.NotFound('Salon not found');

    const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: currentSalon.id });
    if (!category) throw new error.NotFound('Category not found');

    await categoryRepository.softDelete({ uuid: params.uuid });

    return { message: 'Category deleted successfully' };
}