const { z } = require("zod");

exports.listPlansSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).default(10).optional(),
      is_active: z
        .preprocess((val) => {
          if (val === "true" || val === true) return true;
          if (val === "false" || val === false) return false;
          return undefined;
        }, z.boolean().optional())
        .optional(),
      include_inactive: z
        .preprocess((val) => {
          if (val === "true" || val === true) return true;
          if (val === "false" || val === false) return false;
          return undefined;
        }, z.boolean().optional())
        .optional(),
    })
    .default({ page: 1, limit: 10 }),
});
