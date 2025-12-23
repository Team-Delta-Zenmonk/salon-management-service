const { Cart } = require("../models");
const BaseRepository = require("./base.repository");

class CartRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }

    async getCardByUuid(uuid) {
        const include = [
            {
                association: "cart_items",
            },
            {
                association: "salon",
            }
        ];
        return await this.findOne({ uuid }, include);
    }

}

module.exports = new CartRepository({ model: Cart });
