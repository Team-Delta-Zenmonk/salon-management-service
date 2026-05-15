const { z } = require("zod");

exports.getAvailableSlotsSchema = z.object({
  query: z.object({
    cart_id: z.uuid(),
    start_date: z.coerce.date(),
    days: z.coerce.number(),
  }),
});
