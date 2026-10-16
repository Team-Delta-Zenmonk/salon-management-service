const { Staff } = require("../models");
const BaseRepository = require("./base.repository");

class StaffRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findAndCountStorefrontStaff({ salonId, search, offset = 0, limit = 10 }) {
    const { Op } = require("sequelize");
    const criteria = {
      salon_id: salonId,
    };

    if (search && search.trim()) {
      criteria[Op.or] = [
        { first_name: { [Op.iLike]: `%${search.trim()}%` } },
        { last_name: { [Op.iLike]: `%${search.trim()}%` } },
        { title: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    return await this.model.findAndCountAll({
      where: criteria,
      attributes: ["id", "uuid", "first_name", "last_name", "gender", "photos", "title", "active_hours"],
      offset,
      limit,
      order: [["created_at", "DESC"]],
      distinct: true,
    });
  }
}

module.exports = new StaffRepository({ model: Staff });

