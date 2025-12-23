const { z } = require("zod");

exports.listCategorySchema = z.object({
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
});
