const { SubscriptionPlan } = require("../models");
const BaseRepository = require("./base.repository");

class SubscriptionPlanRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findByUuid(uuid, options = {}) {
    if (!uuid) return null;
    return await this.model.findOne({
      where: { uuid },
    });
  }
}

module.exports = new SubscriptionPlanRepository({ model: SubscriptionPlan });
