const { z } = require("zod");

exports.listSubServicesSchema = z.object({
  params: z.object({
    uuid: z.string().min(1, "Service uuid is required"),
  }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).default(10).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    })
    .optional(),
});
