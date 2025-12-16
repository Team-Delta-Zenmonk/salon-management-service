const { z } = require("zod");

exports.updateCartItemSchema = z.object({
    body: z.object({
        staff_id: z.string().uuid().optional(),
        service_id: z.string().uuid().optional(),
        price: z.number().nonnegative().optional(),
        duration: z.number().int().nonnegative().optional(),
    }).refine(data => data.staff_id || data.service_id || data.price !== undefined || data.duration !== undefined, {
        message: "At least one field (staff_id, service_id, price, or duration) must be provided for update",
    })
});
