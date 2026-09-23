const { z } = require("zod");

exports.listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
    is_read: z
      .preprocess(
        (val) => (val === "true" ? true : val === "false" ? false : val),
        z.boolean().optional()
      )
      .optional(),
  }),
});

