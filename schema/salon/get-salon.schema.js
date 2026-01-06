const { z } = require("zod");

exports.getSalonSchema = z.object({
    params: z.object({
        uuid: z.string().min(1, "Salon uuid is required"),
    }),
})