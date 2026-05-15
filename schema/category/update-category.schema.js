const { z } = require("zod");
const { createCategorySchema } = require("./create-category.schema");

exports.updateCategorySchema = z.object({
  params: z.object({
    uuid: z.string().min(1, "Category uuid is required"),
  }),
  body: createCategorySchema.shape.body.partial(),
});
