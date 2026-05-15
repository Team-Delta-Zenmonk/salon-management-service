const { Cart } = require("../models");
const BaseRepository = require("./base.repository");

class CartRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  cartIncludes() {
    return [
      {
        association: "cart_items",
        where: { deleted_at: null },
        required: false,
        include: [
          {
            association: "service",
            attributes: ["id", "uuid", "name", "logo", "gender", "duration", "price"],
          },
          {
            association: "staff",
            attributes: ["id", "uuid", "first_name", "last_name", "photos"],
            required: false,
          },
        ],
        order: [["id", "ASC"]],
      },
      {
        association: "salon",
        attributes: ["id", "uuid", "name", "logo", "address", "type", "business_hours"],
      },
    ];
  }

  async getCartById(id) {
    return await this.findOne({ id, deleted_at: null }, this.cartIncludes());
  }

  async getCartByUuid(uuid) {
    return await this.findOne({ uuid, deleted_at: null }, this.cartIncludes());
  }

  async getActiveCartByCustomerId(customerId) {
    return await this.findOne({ customer_id: customerId, deleted_at: null }, this.cartIncludes());
  }
}

module.exports = new CartRepository({ model: Cart });
