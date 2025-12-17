const { z } = require("zod");
const { ServiceGender, PriceType, DiscountType } = require("../../models/service/service-types");

exports.createServiceSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        duration: z.number().optional(),
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
        price: z.number().min(1, "Price is required"),
        discount: z.number().optional(),
        discount_type: z.enum(DiscountType.getValues(), {
            required_error: "Discount type is required",
        }).optional(),
        duration: z
          .number()
          .int({ message: "duration must be an integer" })
          .positive({ message: "duration must be greater than 0" })
          .max(600, { message: "duration too long" }),
    })
});
