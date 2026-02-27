const { z } = require("zod");

exports.createCartSchema = z.object({
  body: z.object({
    salon_id: z.string().min(1, { message: "Salon ID must be a valid min" }),
    user_id: z.string().min(1, { message: "User ID must be a valid min" }),
    items: z.array(
      z.object({
        service_id: z.string().uuid({ message: "Service ID must be a valid UUID" }),
        staff_id: z.string().uuid().optional(),
        price: z.number().nonnegative().optional(),
        duration: z.number().int().nonnegative().optional(),
      })
    ).min(1, { message: "At least one item is required in the cart" })
  })
});
