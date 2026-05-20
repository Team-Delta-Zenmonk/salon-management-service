const { Op } = require("sequelize");
const { error } = require('../libs');
const { itemsCategoryRepository } = require("../repository");

exports.createCategory = async (payload) => {
  const { body, salon } = payload;

  try {
    return await itemsCategoryRepository.create({
      ...body,
      name: body.name.trim(),
      salon_id: salon.id,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new error.Conflict('Category with this name already exists');
    }
    throw err;
  }
};

exports.listCategories = async (payload) => {
  const { salon, query } = payload;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = query.search;

  const where = { salon_id: salon.id };
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  const { count, rows } = await itemsCategoryRepository.findAndCountAll({
    criteria: where,
    limit: limit,
    offset: (page - 1) * limit,
  });

  return {
    total: count,
    page,
    limit,
    data: rows
  };
};
