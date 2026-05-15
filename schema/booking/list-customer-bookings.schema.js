const { z } = require("zod");

exports.listCustomerBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
  }),
});
