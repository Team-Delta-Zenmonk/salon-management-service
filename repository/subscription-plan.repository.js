const { SubscriptionPlan } = require("../models");
const BaseRepository = require("./base.repository");

class SubscriptionPlanRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new SubscriptionPlanRepository({ model: SubscriptionPlan });
