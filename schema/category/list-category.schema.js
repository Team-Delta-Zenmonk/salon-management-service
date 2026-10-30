const { z } = require("zod");

exports.listCategorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).default(10).optional(),
    search: z.string().optional(),
  }),
});
