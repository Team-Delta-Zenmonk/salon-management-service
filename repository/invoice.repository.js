const BaseRepository = require("./base.repository");
const { Invoice } = require("../models");

class InvoiceRepository extends BaseRepository {
  constructor() {
    super({ model: Invoice });
  }

  async findInvoiceWithDetails(criteria, options = {}) {
    return await this.model.findOne({
      where: criteria,
      include: [
        {
          association: "booking",
          include: [
            { association: "customer" },
            {
              association: "booking_services",
              include: [{ association: "service" }, { association: "staff" }],
            },
          ],
        },
        { association: "salon" },
      ],
      ...options,
    });
  }
}

module.exports = new InvoiceRepository();
