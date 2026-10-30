const { z } = require("zod");

exports.listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).default(20).optional(),
    is_read: z
      .preprocess(
        (val) => (val === "true" ? true : val === "false" ? false : val),
        z.boolean().optional()
      )
      .optional(),
  }),
});

