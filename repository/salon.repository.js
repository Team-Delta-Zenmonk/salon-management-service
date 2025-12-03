const { Salon } = require("../models");
const BaseRepository = require("./base.repository");

class SalonRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }
}

module.exports = new SalonRepository({ model: Salon });
