const { z } = require("zod");

exports.rescheduleBookingSchema = z.object({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  body: z.object({
    slot: z.object({
      start: z.string().datetime().refine((val) => new Date(val).getTime() > Date.now(), {
        message: "Reschedule start time must be in the future",
      }),
      end: z.string().datetime(),
    }),
    date: z.coerce.date(),
  }),
});

