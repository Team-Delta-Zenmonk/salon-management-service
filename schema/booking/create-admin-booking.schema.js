const { default: z } = require("zod");
const { PaymentPolicy } = require("../../models/salon/salon-types");


exports.createAdminBookingSchema = z.object({
  body: z.object({
    admin_booking: z.object({
      name: z.string(),
      phone: z.string(),
    }),
    customer_id: z.number().optional().nullable(),
    booking_start_time: z.coerce.date(),
    booking_date: z.coerce.date(),
    services: z.array(
      z.object({
        service_id: z.number(),
        staff_id: z.number(),
        sequence: z.number().optional(),
      }),
    ),
    payment_preference: z.enum(Object.values(PaymentPolicy.ENUM)),
  }),
});
