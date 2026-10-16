const { z } = require("zod");

exports.listStaffServicesSchema = z.object({
  params: z.object({
    uuid: z.string().uuid("Invalid staff UUID format"),
  }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    })
    .optional(),
});
