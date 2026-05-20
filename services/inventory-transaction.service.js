const { sequelize } = require("../models");
const { Op } = require("sequelize");
const { error } = require('../libs');
const { inventoryTransactionRepository, inventoryItemRepository } = require("../repository");

exports.createTransaction = async (payload) => {
  const { body, salon } = payload;

  const item = await inventoryItemRepository.findOne({
    uuid: body.item_uuid,
    salon_id: salon.id
  });
  if (!item) throw new error.NotFound('Inventory item not found');

  const netChange = (body.received_quantity || 0) - (body.damaged_quantity || 0) - (body.returned_quantity || 0);
  const newStock = item.current_stock + netChange;

  if (newStock < 0) throw new error.BadRequest("Transaction would result in negative stock level");

  const created = await inventoryTransactionRepository.create({
    ...body,
    item_id: item.id,
    salon_id: salon.id
  });

  await inventoryItemRepository.update({
    payload: { current_stock: newStock },
    criteria: { id: item.id }
  });

  return created;
};

exports.listTransactions = async (payload) => {
  const { salon, query } = payload;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const item_uuid = query.item_uuid;
  const search = query.search;

  const where = { salon_id: salon.id };

  if (item_uuid) {
    const item = await inventoryItemRepository.findOne({
      uuid: item_uuid,
      salon_id: salon.id
    });
    if (!item) {
      throw new error.NotFound('Inventory item not found');
    }
    where.item_id = item.id;
  }

  let includeItem = { association: 'item', required: false };
  if (search) {
    includeItem.where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ]
    };
    includeItem.required = true;
  }

  let order = [['created_at', 'DESC']];

  if (query.sort_by) {
    if (query.sort_by === 'received_date') {
      order = [['received_date', query.sort_order === 'ASC' ? 'ASC' : 'DESC']];
    } else if (query.sort_by === 'ordered_date') {
      order = [['ordered_date', query.sort_order === 'DESC' ? 'DESC' : 'ASC']];
    } else if (query.sort_by === 'bill_amount') {
      order = [['bill_amount', query.sort_order === 'ASC' ? 'ASC' : 'DESC']];
    }
  }

  const { count, rows } = await inventoryTransactionRepository.findAndCountAll({
    criteria: where,
    include: [includeItem],
    limit: limit,
    offset: (page - 1) * limit,
    order: order
  });

  return {
    total: count,
    page,
    limit,
    data: rows
  };
};

exports.getTransaction = async (payload) => {
  const { salon, params } = payload;

  const transaction = await inventoryTransactionRepository.findOne(
    { uuid: params.uuid, salon_id: salon.id },
    ["item"]
  );
  if (!transaction) {
    throw new error.NotFound('Inventory transaction not found');
  }

  return transaction;
};

exports.updateTransaction = async (payload) => {
  const { body, salon, params } = payload;

  const transaction = await inventoryTransactionRepository.findOne({
    uuid: params.uuid,
    salon_id: salon.id
  });
  if (!transaction) throw new error.NotFound('Inventory transaction not found');

  const item = await inventoryItemRepository.findOne({
    id: transaction.item_id,
    salon_id: salon.id
  });
  if (!item) throw new error.NotFound('Inventory item not found');

  const oldNetChange = (transaction.received_quantity || 0) - (transaction.damaged_quantity || 0) - (transaction.returned_quantity || 0);
  const newNetChange = (body.received_quantity || 0) - (body.damaged_quantity || 0) - (body.returned_quantity || 0);
  const newStock = item.current_stock - oldNetChange + newNetChange;

  if (newStock < 0) throw new error.BadRequest("Updating transaction would result in negative stock level");

  return await inventoryTransactionRepository.handleManagedTransaction(async (t) => {
    await inventoryTransactionRepository.update({
      payload: body,
      criteria: { uuid: params.uuid },
      options: { transaction: t }
    });

    await inventoryItemRepository.update({
      payload: { current_stock: newStock },
      criteria: { id: item.id },
      options: { transaction: t }
    });

    return { message: 'Transaction updated successfully' };
  });
};
