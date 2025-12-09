const { z } = require("zod");

exports.listServicesByCategorySchema = z.object({
    params: z.object({
        uuid: z.string().min(1, "Category uuid is required"),
    })
});