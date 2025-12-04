const { Salon } = require("../models");
const BaseRepository = require("./base.repository");

class SalonRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }

    async findByEmailReturnWithPassword(email) {
        return await this.model.scope('withPassword').findOne({ where: { email: email } });
    }
}

module.exports = new SalonRepository({ model: Salon });
