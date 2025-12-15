const { z } = require("zod");

exports.updateCartItemSchema = z.object({
    body: z.object({
        staff_id: z.string().uuid().optional(),
        service_id: z.string().uuid().optional(),
    }).refine(data => data.staff_id || data.service_id, {
        message: "At least one field (staff_id or service_id) must be provided for update",
    })
});
