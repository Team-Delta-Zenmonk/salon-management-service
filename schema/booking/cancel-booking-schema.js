const { z } = require("zod");

exports.cancelBookingSchema = z.object({
  params: z.object({
    uuid: z.uuid(),
  }),
});
