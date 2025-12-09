const { z } = require("zod");

exports.deleteCategorySchema = z.object({
    params: z.object({
        uuid: z.string().min(1, "Category uuid is required")
    })
});