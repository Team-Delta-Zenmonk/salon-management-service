const { z } = require("zod");

exports.listStaffServicesSchema = z.object({
  params: z.object({
    uuid: z.string().uuid("Invalid staff UUID format"),
  }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    })
    .optional(),
});
