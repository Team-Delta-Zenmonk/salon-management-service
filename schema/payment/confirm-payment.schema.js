const { z } = require("zod");

exports.confirmPaymentSchema = z.object({
  body: z.object({
    stripe_payment_intent_id: z.string().min(1, "Payment intent ID is required"),
  }),
});
