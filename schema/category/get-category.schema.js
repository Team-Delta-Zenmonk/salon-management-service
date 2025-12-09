const { z } = require("zod");

exports.getCategorySchema = z.object({
    params: z.object({
        uuid: z.string().min(1, "Category uuid is required")
    })
});