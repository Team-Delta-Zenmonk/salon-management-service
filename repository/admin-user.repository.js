const { AdminUser } = require("../models");
const BaseRepository = require("./base.repository");

class AdminUserRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findByEmailReturnWithPassword(email) {
    return await this.model.scope("withPassword").findOne({ where: { email } });
  }
}

module.exports = new AdminUserRepository({ model: AdminUser });
