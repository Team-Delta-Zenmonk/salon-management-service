const BaseRepository = require("./base.repository");
const { InventoryTransaction } = require("../models");

class InventoryTransactionRepository extends BaseRepository {
  constructor() {
    super({ model: InventoryTransaction });
  }
}

module.exports = new InventoryTransactionRepository();
