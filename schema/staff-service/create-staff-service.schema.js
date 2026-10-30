const { z } = require("zod");
const { PriceType } = require("../../models/service/service-types");
const { CURRENCY_CONFIG, DEFAULT_CURRENCY } = require("../../common/currencies.config");

exports.createStaffServicesSchema = z.object({
  body: z.object({
    staff_services: z.array(
      z
        .object({
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
            .max(1440, { message: "duration too long" }),
        })
        .superRefine((data, ctx) => {
          const minPrice = CURRENCY_CONFIG[DEFAULT_CURRENCY].minServicePrice;
          const symbol = CURRENCY_CONFIG[DEFAULT_CURRENCY].symbol;
          if (data.price_type === PriceType.ENUM.FIXED || data.price_type === PriceType.ENUM.FROM) {
            if (data.price < minPrice) {
              ctx.addIssue({
                code: "custom",
                path: ["price"],
                message: `Staff price must be at least ${symbol}${minPrice} for paid services (minimum payment requirement)`,
              });
            }
          } else if (data.price_type === PriceType.ENUM.FREE && data.price !== 0) {
            ctx.addIssue({
              code: "custom",
              path: ["price"],
              message: "Staff price must be 0 for free service",
            });
          }
        }),
    ),
  }),
});
