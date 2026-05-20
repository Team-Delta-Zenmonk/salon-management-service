const { Op } = require("sequelize");
const { error } = require("../libs");
const { inventoryItemRepository, itemsCategoryRepository } = require("../repository");

exports.createInventoryItem = async (payload) => {
  const { body, salon } = payload;

  const category = await itemsCategoryRepository.findOne({
    uuid: body.category_id,
    salon_id: salon.id,
  });
  if (!category) {
    throw new error.NotFound("Category not found");
  }

  const existing = await inventoryItemRepository.findOne({
    salon_id: salon.id,
    name: body.name.trim(),
    brand: body.brand ? body.brand.trim() : null,
    variant_name: body.variant_name ? body.variant_name.trim() : null,
  });

  if (existing) {
    throw new error.Conflict("Inventory item with this name, brand, and variant already exists");
  }

  return await inventoryItemRepository.create({
    ...body,
    category_id: category.id,
    salon_id: salon.id,
    current_stock: 0,
  });
};

exports.listInventoryItems = async (payload) => {
  const { salon, query } = payload;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = query.search;
  const category_uuid = query.category_id;
  const item_type = query.item_type;

  const where = { salon_id: salon.id };

  if (search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { brand: { [Op.iLike]: `%${search}%` } }];
  }

  if (item_type) {
    where.item_type = item_type;
  }

  if (category_uuid) {
    const category = await itemsCategoryRepository.findOne({
      uuid: category_uuid,
      salon_id: salon.id,
    });
    if (!category) {
      throw new error.NotFound("Category not found");
    }
    where.category_id = category.id;
  }

  let order = [["created_at", "DESC"]];

  if (query.sort_by) {
    if (query.sort_by === "name") {
      order = [["name", query.sort_order === "DESC" ? "DESC" : "ASC"]];
    } else if (query.sort_by === "current_stock") {
      order = [["current_stock", query.sort_order === "ASC" ? "ASC" : "DESC"]];
    } else if (query.sort_by === "newest") {
      order = [["created_at", "DESC"]];
    }
  }

  const { count, rows } = await inventoryItemRepository.findAndCountAll({
    criteria: where,
    include: ["category"],
    limit: limit,
    offset: (page - 1) * limit,
    order: order,
  });

  return {
    total: count,
    page,
    limit,
    data: rows,
  };
};

exports.updateInventoryItem = async (payload) => {
  const { body, salon, params } = payload;

  const item = await inventoryItemRepository.findOne({
    uuid: params.uuid,
    salon_id: salon.id,
  });
  if (!item) throw new error.NotFound("Inventory item not found");

  if (body.category_id) {
    const category = await itemsCategoryRepository.findOne({
      uuid: body.category_id,
      salon_id: salon.id,
    });
    if (!category) throw new error.NotFound("Category not found");
  }

  await inventoryItemRepository.update({
    payload: body,
    criteria: { uuid: params.uuid },
  });

  return { message: "Inventory item updated successfully" };
};

exports.getInventoryItem = async (payload) => {
  const { salon, params } = payload;

  const item = await inventoryItemRepository.findOne({ uuid: params.uuid, salon_id: salon.id }, ["category"]);
  if (!item) {
    throw new error.NotFound("Inventory item not found");
  }

  return item;
};
