const { ThemeInvoice } = require("../models");
const BaseRepository = require("./base.repository");

class ThemeInvoiceRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new ThemeInvoiceRepository({ model: ThemeInvoice });

