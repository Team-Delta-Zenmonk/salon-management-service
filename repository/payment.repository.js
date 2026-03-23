const { Payment } = require("../models");
const BaseRepository = require("./base.repository");

class PaymentRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new PaymentRepository({ model: Payment });
