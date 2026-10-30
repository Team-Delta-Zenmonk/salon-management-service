const { Op } = require("sequelize");
const { Service, sequelize } = require("../models");
const BaseRepository = require("./base.repository");

class ServiceRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findAndCountStorefrontServices({ salonId, categoryId, search, gender, offset = 0, limit = 10 }) {
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
      attributes: {
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(*)::int FROM services AS child WHERE child.parent_id = "Service".id AND child.deleted_at IS NULL AND child.is_active = true)`
            ),
            "sub_services_count",
          ],
        ],
      },
      include: [
        {
          association: "category",
          attributes: ["id", "uuid", "name"],
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

