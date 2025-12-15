const { z } = require("zod");

exports.addItemSchema = z.object({
    body: z.object({
        cart_id: z.string().uuid({ message: "Cart ID must be a valid UUID" }),
        service_id: z.string().uuid({ message: "Service ID must be a valid UUID" }),
        staff_id: z.string().uuid({ message: "Staff ID must be a valid UUID" }),
    })
});
