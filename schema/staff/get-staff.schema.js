const { z } = require("zod");

exports.getStaffSchema = z.object({
  params: z.object({
    uuid: z.uuid("Invalid staff UUID format"),
  }),
});
