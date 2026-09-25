const { z } = require("zod");
const { ServiceGender, PriceType, DiscountType } = require("../../models/service/service-types");

exports.createServiceSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      category_id: z.string().optional(),
      parent_id: z.string().optional(),
      is_active: z.boolean().optional(),
      is_popular: z.boolean().optional(),
      gender: z.enum(ServiceGender.getValues(), {
        required_error: "Gender is required",
      }),
      price_type: z.enum(PriceType.getValues(), {
        required_error: "Price type is required",
      }),
      price: z
        .number()
        .min(0, "Price cannot be negative")
        .max(100000, "Price cannot exceed 1,00,000"),
      discount: z.number().optional(),
      discount_type: z
        .enum(DiscountType.getValues(), {
          required_error: "Discount type is required",
        })
        .optional(),
      duration: z
        .number()
        .int({ message: "Duration must be an integer" })
        .positive({ message: "Duration must be greater than 0" })
        .max(600, { message: "Duration cannot exceed 10 hours (600 minutes)" }),
    })
    .superRefine((data, ctx) => {
      if (data.discount && data.discount > 0) {
        if (data.discount_type === DiscountType.ENUM.PERCENTAGE) {
          if (data.discount > 100) {
            ctx.addIssue({
              code: "custom",
              path: ["discount"],
              message: "Discount percentage cannot be greater than 100%",
            });
          }
        } else if (data.discount_type === DiscountType.ENUM.AMOUNT) {
          if (data.price && data.discount > data.price) {
            ctx.addIssue({
              code: "custom",
              path: ["discount"],
              message: "Discount amount cannot greater than the price (100%)",
            });
          }
        }
      }
    }),
});
