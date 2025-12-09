const { z } = require("zod");
const { PriceType } = require("../../models/service/service-types");

exports.createStaffServicesSchema = z.object({
  body: z.object({
    staff_services: z.array(
      z.object({
        service_uuid: z.uuid({ message: "service_uuid must be a valid UUID" }),

        staff_uuid: z.uuid({ message: "staff_uuid must be a valid UUID" }),

        price_type: z.enum(Object.values(PriceType.ENUM), {
          message: "price_type must be one of: fixed, from, free",
        }),

        price: z
          .number()
          .nonnegative({ message: "price must be a positive number" })
          .max(999999, { message: "price is too large" }),

        duration: z
          .number()
          .int({ message: "duration must be an integer" })
          .positive({ message: "duration must be greater than 0" })
          .max(600, { message: "duration too long" }),
      })
    ),
  }),
});
