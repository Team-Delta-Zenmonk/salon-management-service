const { Cart } = require("../models");
const BaseRepository = require("./base.repository");

class CartRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }
}

module.exports = new CartRepository({ model: Cart });
