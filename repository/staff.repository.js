const { Staff } = require("../models");
const BaseRepository = require("./base.repository");

class StaffRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }
}

module.exports = new StaffRepository({ model: Staff });
