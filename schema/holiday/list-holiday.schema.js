const { z } = require("zod");
const { HolidayType } = require("../../models/holiday/holiday-types");

exports.listHolidaySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).default(10).optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    holiday_type: z.enum(HolidayType.getValues()),
    parent_id: z.string(),
    year: z.string().optional(),
    month: z.string().optional(),
  }),
});
