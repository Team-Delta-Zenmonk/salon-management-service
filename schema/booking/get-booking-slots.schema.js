const { z } = require("zod");

exports.getBookingAvailableSlotsSchema = z.object({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  query: z.object({
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
    days: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 7))
      .refine((val) => val > 0 && val <= 30, {
        message: "Days must be between 1 and 30",
      }),
  }),
});
