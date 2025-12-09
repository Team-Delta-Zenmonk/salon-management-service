const { z } = require("zod");

exports.removeStaffSchema = z.object({
  params: z.object({
    uuid: z.uuid("Invalid staff UUID format"),
  }),
});
