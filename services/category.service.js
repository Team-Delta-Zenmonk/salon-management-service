const { error } = require('../libs');
const { categoryRepository } = require("../repository");

exports.createCategory = async (payload) => {
    const { body, salon } = payload;

    return await categoryRepository.create({
        ...body,
        salon_id: salon.id,
    });

}

exports.listCategories = async (payload) => {
    const { salon } = payload;

    return await categoryRepository.findAndCountAll({ criteria: { salon_id: salon.id } });
}

exports.updateCategory = async (payload) => {
    const { body, salon, params } = payload;

    const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
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

    const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
    if (!category) throw new error.NotFound('Category not found');

    await categoryRepository.softDelete({ uuid: params.uuid });

    return { message: 'Category deleted successfully' };
}

exports.getCategory = async (payload) => {
    const { salon, params } = payload;

    const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
    if (!category) throw new error.NotFound('Category not found');

    return category;
}