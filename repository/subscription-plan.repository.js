const { SubscriptionPlan } = require("../models");
const BaseRepository = require("./base.repository");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class SubscriptionPlanRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findByUuid(uuidOrCode, options = {}) {
    if (!uuidOrCode) return null;

    if (UUID_REGEX.test(uuidOrCode)) {
      return await this.model.findOne({
        where: { uuid: uuidOrCode },
        ...options,
      });
    }

    return await this.model.findOne({
      where: { code: uuidOrCode },
      ...options,
    });
  }

  async findByCode(code, options = {}) {
    if (!code) return null;
    return await this.model.findOne({
      where: { code },
      ...options,
    });
  }
}

module.exports = new SubscriptionPlanRepository({ model: SubscriptionPlan });
