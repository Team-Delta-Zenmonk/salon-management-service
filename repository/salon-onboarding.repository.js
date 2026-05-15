const BaseRepository = require("./base.repository");
const { SalonOnboarding } = require("../models");

class SalonOnboardingRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }
}

module.exports = new SalonOnboardingRepository({ model: SalonOnboarding });
