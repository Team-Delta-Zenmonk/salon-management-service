const { default: z } = require("zod");

exports.createBookingSchema = z.object({
  body: z.object({
    cart_id: z.uuid(),
    slot: z.object({
      start: z.iso.datetime(),
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
  }),
});
