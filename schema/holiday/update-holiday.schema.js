const { z } = require("zod");
const { createHolidaySchema } = require("./create-holiday.schema");

exports.updateHolidaySchema = z.object({
  params: z.object({
    uuid: z.string().min(1, "Holiday uuid is required"),
  }),
  body: createHolidaySchema.shape.body.partial(),
});
