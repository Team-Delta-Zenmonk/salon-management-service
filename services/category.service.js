const { Op } = require("sequelize");
const { error } = require("../libs");
const { categoryRepository } = require("../repository");

exports.createCategory = async (payload) => {
  const { body, salon } = payload;

  return await categoryRepository.create({
    ...body,
    salon_id: salon.id,
  });
};

exports.listCategories = async (payload) => {
  const { salon, query } = payload;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = query.search;

  const where = { salon_id: salon.id };

  if (search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }];
  }

  const { count, rows } = await categoryRepository.findAndCountAll({
    criteria: where,
    limit: limit,
    offset: (page - 1) * limit,
    order: [["created_at", "DESC"]]
  });

  return {
    total: count,
    page,
    limit,
    data: rows,
  };
};

exports.updateCategory = async (payload) => {
  const { body, salon, params } = payload;

  const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
  if (!category) throw new error.NotFound("Category not found");

  const response = await categoryRepository.update({
    payload: body,
    criteria: { uuid: params.uuid },
  });

  if (response[0] === 1) return { message: "Successfully updated category" };

  throw new error.BadRequest("Failed to update category");
};

exports.deleteCategory = async (payload) => {
  const { salon, params } = payload;

  const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
  if (!category) throw new error.NotFound("Category not found");

  await categoryRepository.destroy({ criteria: { uuid: params.uuid } });

  return { message: "Category deleted successfully" };
};

exports.getCategory = async (payload) => {
  const { salon, params } = payload;

  const category = await categoryRepository.findOne({ uuid: params.uuid, salon_id: salon.id });
  if (!category) throw new error.NotFound("Category not found");

  return category;
};
