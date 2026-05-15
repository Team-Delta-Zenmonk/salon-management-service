const { default: z } = require("zod");

exports.updateAdminBookingSchema = z.object({
  body: z.object({
    admin_booking: z
      .object({
        name: z.string(),
        phone: z.string(),
      })
      .optional(),
    customer_id: z.number().optional().nullable(),
    booking_start_time: z.coerce.date().optional(),
    booking_date: z.coerce.date().optional(),
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "expired"]).optional(),
    services: z
      .array(
        z.object({
          service_id: z.number(),
          staff_id: z.number(),
          sequence: z.number().optional(),
        }),
      )
      .optional(),
  }),
});
