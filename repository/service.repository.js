const { Service } = require("../models");
const BaseRepository = require("./base.repository");

class ServiceRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findAndCountStorefrontServices({ salonId, categoryId, search, gender, offset = 0, limit = 10 }) {
    const { Op } = require("sequelize");
    const criteria = {
      salon_id: salonId,
      parent_id: null,
      is_active: true,
    };

    if (categoryId) {
      criteria.category_id = categoryId;
    }

    if (gender && gender !== "all") {
      criteria.gender = gender;
    }

    if (search && search.trim()) {
      criteria.name = { [Op.iLike]: `%${search.trim()}%` };
    }

    return await this.model.findAndCountAll({
      where: criteria,
      include: [
        {
          association: "category",
          attributes: ["id", "uuid", "name"],
        },
        {
          association: "children",
          where: { is_active: true },
          required: false,
        },
      ],
      offset,
      limit,
      order: [["created_at", "DESC"]],
      distinct: true,
    });
  }
}

module.exports = new ServiceRepository({ model: Service });

