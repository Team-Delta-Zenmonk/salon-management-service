const { z } = require("zod");

exports.removeStaffSchema = z.object({
  params: z.object({
    staff_uuid: z.uuid("Invalid staff UUID format"),
  }),
});
