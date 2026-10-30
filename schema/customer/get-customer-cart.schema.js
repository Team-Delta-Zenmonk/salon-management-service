const { z } = require("zod");

exports.getCustomerCartSchema = z.object({
  params: z.object({
    uuid: z.string().min(1, "Customer uuid is required"),
  }),
  query: z
    .object({
      salon_id: z.string().optional(),
    })
    .optional(),
});
