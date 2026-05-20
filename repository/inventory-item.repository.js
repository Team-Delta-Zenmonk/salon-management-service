const BaseRepository = require('./base.repository');
const { InventoryItem } = require('../models');

class InventoryItemRepository extends BaseRepository {
  constructor() {
    super({ model: InventoryItem });
  }
}

module.exports = new InventoryItemRepository();
