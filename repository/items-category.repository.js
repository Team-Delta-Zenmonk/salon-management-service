const BaseRepository = require("./base.repository");
const { ItemsCategory } = require("../models");

class ItemsCategoryRepository extends BaseRepository {
  constructor() {
    super({ model: ItemsCategory });
  }
}

module.exports = new ItemsCategoryRepository();
