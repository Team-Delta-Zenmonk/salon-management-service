const { z } = require("zod");

exports.createCartSchema = z.object({
    body: z.object({
        salon_id: z.string().uuid({ message: "Salon ID must be a valid UUID" }),
        items: z.array(z.object({
            service_id: z.string().uuid({ message: "Service ID must be a valid UUID" }),
            staff_id: z.string().uuid({ message: "Staff ID must be a valid UUID" }),
        })).min(1, { message: "At least one item is required in the cart" })
    })
});
