const { z } = require("zod");

exports.deleteCartSchema = z.object({
    params: z.object({
        uuid: z.string().uuid({ message: "Invalid UUID format" }),
    })
});
