const { Service } = require("../models");
const BaseRepository = require("./base.repository");

class ServiceRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }


}

module.exports = new ServiceRepository({ model: Service });