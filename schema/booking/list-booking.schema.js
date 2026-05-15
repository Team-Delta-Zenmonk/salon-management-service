const { z } = require("zod");

exports.listBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
    filter: z.enum(["day", "week", "month"]).optional().default("day"),
    status: z.string().optional(),
  }),
});
