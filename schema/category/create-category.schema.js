const { z } = require("zod");

exports.createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Category name is required"),
        description: z.string(),
        logo: z.string(),
    })
});