const { z } = require("zod");

exports.upgradeSubscriptionSchema = z.object({
  body: z.object({
    plan: z.string({ required_error: "Plan code is required" }).min(1, { message: "Plan code is required" }),
    billing_cycle: z.string().optional(),
    payment_method: z.string().optional(),
    payment_details: z.record(z.any()).optional(),
    transaction_id: z.string().optional(),
  }),
});
