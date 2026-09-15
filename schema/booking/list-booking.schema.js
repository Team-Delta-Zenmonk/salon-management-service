const { z } = require("zod");

exports.listBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(12),
    filter: z.enum(["day", "week", "month"]).optional().default("month"),
    status: z.string().optional(),
    view: z.enum(["calendar", "table"]).optional().default("table"),
    payment_policy: z.enum(["pay_at_venue", "partial_deposit", "full_upfront"]).optional(),
    staff_uuid: z.string().uuid().optional(),
    service_uuid: z.string().uuid().optional(),
    is_walk_in: z.preprocess((val) => (val === "true" ? true : val === "false" ? false : val), z.boolean().optional()),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
  }),
});
