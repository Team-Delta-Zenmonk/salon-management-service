const { StaffService } = require("../models");
const BaseRepository = require("./base.repository");

class StaffServiceRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }
}

module.exports = new StaffServiceRepository({ model: StaffService });
