const { z } = require("zod");

exports.updateStockSchema = z.object({
  body: z.object({
    current_stock: z.number().min(0),
  }),
  params: z.object({
    uuid: z.string().uuid(),
  }),
});
