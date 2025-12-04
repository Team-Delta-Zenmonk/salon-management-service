const { Category } = require("../models");
const BaseRepository = require("./base.repository");

class CategoryRepository extends BaseRepository {
    constructor(payload) {
        super(payload);
    }
}

module.exports = new CategoryRepository({ model: Category });
