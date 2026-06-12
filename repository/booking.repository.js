const { Op, literal } = require("sequelize");
const { Booking } = require("../models");
const BaseRepository = require("./base.repository");
const { BookingStatus } = require("../models/booking/booking-types");
class BookingRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async getBookingsByDate(salon_id, start_date, days) {
    const start = new Date(start_date);
    const end = new Date(start_date);
    end.setDate(end.getDate() + Number(days));
    const criteria = {
      salon_id,
      booking_date: {
        [Op.gte]: start,
        [Op.lt]: end,
      },
    };

    return await this.findAll({
      criteria,
      order: [["booking_start_time", "ASC"]],
      include: [
        {
          association: "booking_services",
        },
      ],
    });
  }

  async findAllBookings({ page, limit, start, end, salon_id, payment_policy, staff_uuid, service_uuid, sort_by, sort_order, no_limit }) {
    const offset = (page - 1) * limit;

    const where = {
      salon_id,
      booking_date: {
        [Op.between]: [start, end],
      },
      status: {
        [Op.notIn]: [BookingStatus.ENUM.EXPIRED, BookingStatus.ENUM.PENDING],
      },
    };

    // Add payment_policy filter
    if (payment_policy) {
      where.payment_policy = payment_policy;
    }

    // Add staff filter via subquery to avoid affecting included data
    if (staff_uuid) {
      where.id = {
        ...(where.id || {}),
        [Op.in]: literal(
          `(SELECT DISTINCT bs."booking_id" FROM "booking_services" bs INNER JOIN "staffs" s ON bs."staff_id" = s."id" WHERE s."uuid" = '${staff_uuid}')`
        ),
      };
    }

    // Add service filter via subquery
    if (service_uuid) {
      // If staff_uuid already set where.id, we need to combine
      if (where.id && where.id[Op.in]) {
        // Use Op.and to combine both subqueries
        where[Op.and] = [
          ...(where[Op.and] || []),
          {
            id: {
              [Op.in]: literal(
                `(SELECT DISTINCT bs."booking_id" FROM "booking_services" bs INNER JOIN "services" sv ON bs."service_id" = sv."id" WHERE sv."uuid" = '${service_uuid}')`
              ),
            },
          },
        ];
      } else {
        where.id = {
          ...(where.id || {}),
          [Op.in]: literal(
            `(SELECT DISTINCT bs."booking_id" FROM "booking_services" bs INNER JOIN "services" sv ON bs."service_id" = sv."id" WHERE sv."uuid" = '${service_uuid}')`
          ),
        };
      }
    }

    const order = [[sort_by || "booking_date", sort_order || "DESC"]];

    const queryOptions = {
      where,
      include: [
        {
          association: "customer",
          attributes: ["name", "email"],
        },
        {
          association: "booking_services",
          include: [
            { association: "service", attributes: ["name", "uuid"] },
            { association: "staff", attributes: ["first_name", "last_name", "uuid"] },
          ],
        },
      ],
      order,
      distinct: true,
    };

    // For calendar view: no pagination (fetch all in date range)
    // For table view: apply limit/offset
    if (!no_limit) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    return await this.model.findAndCountAll(queryOptions);
  }

  async findAllCustomerBookings({ page, limit, customer_id, status }) {
    const offset = (page - 1) * limit;

    const queryCriteria = { customer_id };

    if (status === BookingStatus.ENUM.EXPIRED) {
      queryCriteria[Op.or] = [
        { status: BookingStatus.ENUM.EXPIRED },
        {
          status: BookingStatus.ENUM.PENDING,
          expires_at: { [Op.lt]: new Date() },
        },
      ];
    } else if (status === BookingStatus.ENUM.PENDING) {
      queryCriteria.status = BookingStatus.ENUM.PENDING;
      queryCriteria.expires_at = { [Op.gt]: new Date() };
    } else if (status) {
      queryCriteria.status = status;
    }

    return await this.model.findAndCountAll({
      where: queryCriteria,
      include: [
        {
          association: "salon",
          attributes: ["id", "name", "address", "logo"],
        },
        {
          association: "payments",
        },
        {
          association: "booking_services",
          include: [{ association: "service", attributes: ["name"] }],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
  }

  async getActivePendingBooking({ customer_id, salon_uuid }, transaction = null) {
    const criteria = {
      customer_id,
      status: BookingStatus.ENUM.PENDING,
      expires_at: {
        [Op.gt]: new Date(),
      },
    };

    const include = [{ association: "booking_services" }];

    if (salon_uuid) {
      include.push({
        association: "salon",
        where: { uuid: salon_uuid },
        required: true,
      });
    }

    return await this.findOne(criteria, include, {}, { transaction });
  }

  async expirePendingBookings() {
    return await this.model.update(
      {
        status: BookingStatus.ENUM.EXPIRED,
      },

      {
        where: {
          status: BookingStatus.ENUM.PENDING,

          expires_at: {
            [Op.lt]: new Date(),
          },
        },
      },
    );
  }

  async findBookingWithDetails(criteria, options = {}) {
    const include = [
      {
        association: "booking_services",
        include: [
          { association: "service", attributes: ["name", "uuid"] },
          { association: "staff", attributes: ["first_name", "last_name", "uuid"] },
        ],
      },
      {
        association: "customer",
        attributes: ["name", "email"],
      },
    ];

    return await this.findOne(criteria, include, {}, options);
  }
}

module.exports = new BookingRepository({ model: Booking });
