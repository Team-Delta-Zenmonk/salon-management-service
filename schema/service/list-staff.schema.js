const { z } = require("zod");

exports.listServiceStaffSchema = z.object({
  params: z.object({
    uuid: z.string().min(1, "Service uuid is required"),
  }),
  query: z
    .object({
      salon_uuid: z.string().optional(),
      salon_id: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).optional(),
      offset: z.coerce.number().int().min(0).optional(),
      include_parent: z
        .preprocess((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : val), z.boolean())
        .optional(),
    })
    .optional(),
});
