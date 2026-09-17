const { SubscriptionInvoice } = require("../models");
const BaseRepository = require("./base.repository");

class SubscriptionInvoiceRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new SubscriptionInvoiceRepository({ model: SubscriptionInvoice });
