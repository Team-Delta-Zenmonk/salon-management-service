const { z } = require("zod");

exports.deleteHolidaySchema = z.object({
  params: z.object({
    uuid: z.string().min(1, "Holiday uuid is required"),
  }),
});
