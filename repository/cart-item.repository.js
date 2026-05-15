const { CartItem } = require("../models");
const BaseRepository = require("./base.repository");

class CartItemRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new CartItemRepository({ model: CartItem });
