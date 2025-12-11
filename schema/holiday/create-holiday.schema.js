const { z } = require("zod");
const { HolidayType } = require("../../models/holiday/holiday-types");

exports.createHolidaySchema = z.object({
    body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters long").max(100, "Name must be at most 100 characters long"),
        description: z.string().min(3, "Description must be at least 3 characters long").optional(),
        holiday_date: z.coerce.date(),
        holiday_type: z.enum(HolidayType.getValues(), { message: "Invalid holiday type" }),
        parent_id: z.uuid().optional(),
    })
})