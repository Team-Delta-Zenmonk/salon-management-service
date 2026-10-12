const { StorefrontTheme } = require("../models");
const BaseRepository = require("./base.repository");

class StorefrontThemeRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new StorefrontThemeRepository({ model: StorefrontTheme });

