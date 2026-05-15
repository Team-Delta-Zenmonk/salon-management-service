const { Customer } = require("../models");
const BaseRepository = require("./base.repository");

class CustomerRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new CustomerRepository({ model: Customer });
