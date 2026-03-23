const { z } = require("zod");

exports.createPaymentIntentSchema = z.object({
  body: z.object({
    booking_id: z.string().uuid({ message: "Invalid booking ID" }),
  }),
});
