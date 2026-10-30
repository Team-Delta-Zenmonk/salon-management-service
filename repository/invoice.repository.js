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
          required: false,
          include: [
            { association: "customer", required: false },
            {
              association: "booking_services",
              required: false,
              include: [
                { association: "service", required: false },
                { association: "staff", required: false },
              ],
            },
          ],
        },
        { association: "salon", required: false },
        { association: "theme", required: false },
      ],
      ...options,
    });
  }

  async findPaginated({
    criteria = {},
    include = [],
    order = [["created_at", "DESC"]],
    page = 1,
    limit = 10,
  }) {
    const offset = (page - 1) * limit;
    const { count, rows } = await this.model.findAndCountAll({
      where: criteria,
      include,
      order,
      offset,
      limit,
      distinct: true,
    });

    return {
      invoices: rows,
      pagination: {
        total: count,
        page,
        limit,
      },
    };
  }
}

module.exports = new InvoiceRepository();
