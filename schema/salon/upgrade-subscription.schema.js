const { z } = require("zod");

exports.upgradeSubscriptionSchema = z.object({
  body: z.object({
    plan: z.enum(["monthly", "yearly"], {
      message: "Plan must be either 'monthly' or 'yearly'",
    }),
    billing_cycle: z.enum(["monthly", "yearly"]).optional(),
    payment_method: z.enum(["card", "upi", "netbanking"]).optional(),
    payment_details: z.record(z.any()).optional(),
    transaction_id: z.string().optional(),
  }),
});
