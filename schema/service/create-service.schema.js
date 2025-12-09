const { z } = require("zod");
const { ServiceGender, PriceType, DiscountType } = require("../../models/service/service-types");

exports.createServiceSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string(),
        duration: z.number(),
        category_id: z.string(),
        parent_id: z.string(),
        is_active: z.boolean(),
        is_popular: z.boolean(),
        gender: z.enum(ServiceGender.getValues(), {
            required_error: "Gender is required",
        }),
        price_type: z.enum(PriceType.getValues(), {
            required_error: "Price type is required",
        }),
        price: z.number().min(1, "Price is required"),
        discount: z.number(),
        discount_type: z.enum(DiscountType.getValues(), {
            required_error: "Discount type is required",
        }),
    })
});
