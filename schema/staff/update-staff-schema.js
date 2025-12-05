const { z } = require("zod");
const { createStaffSchema } = require("./create-staff-schema");

exports.updateStaffSchema = z.object({
  params: z.object({
    staff_uuid: z.uuid("Invalid staff UUID format"),
  }),
  body: createStaffSchema.shape.body.partial(),
});