const { z } = require("zod");

exports.createItemsCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required" }),
  }),
});
