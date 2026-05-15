const { default: z } = require("zod");

exports.deleteAdminBookingSchema = z.object({
  params: z.object({
    uuid: z.string().uuid(),
  }),
});
