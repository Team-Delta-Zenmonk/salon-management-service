const { z } = require("zod");

exports.listStaffServicesSchema = z.object({
  params: z.object({
    uuid: z.uuid("Invalid staff UUID format"),
  }),
});
