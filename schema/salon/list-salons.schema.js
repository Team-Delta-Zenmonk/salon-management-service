const { z } = require("zod");

exports.listSalonsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      search: z.string().optional(),
      category: z.string().optional(),
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),
      range: z.coerce.number().optional(),
    })
    .refine(
      (data) => {
        if ((data.latitude && !data.longitude) || (!data.latitude && data.longitude)) {
          return false;
        }
        return true;
      },
      {
        message: "Both latitude and longitude must be provided together.",
        path: ["latitude"],
      },
    ),
});
