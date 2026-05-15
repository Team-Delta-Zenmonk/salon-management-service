const { z } = require("zod");
const { HolidayType } = require("../../models/holiday/holiday-types");

exports.listHolidaySchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    page: z.string().optional(),
    holiday_type: z.enum(HolidayType.getValues()),
    parent_id: z.string(),
    year: z.string().optional(),
    month: z.string().optional(),
  }),
});
