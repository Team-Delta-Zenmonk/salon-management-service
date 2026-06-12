const { default: z } = require("zod");
const { PaymentPolicy } = require("../../models/salon/salon-types");

exports.createBookingSchema = z.object({
  body: z.object({
    cart_id: z.uuid(),
    slot: z.object({
      start: z.iso.datetime().refine((val) => new Date(val).getTime() > Date.now(), {
        message: "Booking start time cannot be in the past",
      }),
      end: z.iso.datetime(),
      services: z.array(
        z.object({
          service_id: z.number(),
          staff_id: z.number(),
        }),
      ),
    }),
    date: z.coerce.date(),
    replace_existing_booking: z.boolean().optional(),
    payment_preference: z.enum(Object.values(PaymentPolicy.ENUM)).optional(),
  }),
});
