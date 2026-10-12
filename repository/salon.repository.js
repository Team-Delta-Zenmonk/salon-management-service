const { Salon } = require("../models");
const BaseRepository = require("./base.repository");

class SalonRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findByEmailReturnWithPassword(email) {
    return await this.model.scope("withPassword").findOne({ where: { email: email } });
  }

  async findByUuid(uuid) {
    return await this.model.findOne({
      where: { uuid },

      attributes: {
        exclude: ["password", "reset_password_token", "reset_token_expiry", "deleted_at"],
      },

      include: [
        {
          association: "staff",
          attributes: ["id", "uuid", "first_name", "last_name", "gender", "photos", "title", "active_hours"],
        },
        {
          association: "categories",
        },
        {
          association: "services",
        },
        {
          association: "holidays",
        },
        {
          association: "storefrontTheme",
        },
      ],
    });
  }

  async findBySlug(slug) {
    return await this.model.findOne({
      where: { slug, is_active: true },
      attributes: {
        exclude: ["password", "reset_password_token", "reset_token_expiry", "deleted_at"],
      },
      include: [
        {
          association: "staff",
          attributes: ["id", "uuid", "first_name", "last_name", "gender", "photos", "title", "active_hours"],
        },
        {
          association: "categories",
        },
        {
          association: "services",
        },
        {
          association: "holidays",
        },
        {
          association: "storefrontTheme",
        },
      ],
    });
  }
}

module.exports = new SalonRepository({ model: Salon });
