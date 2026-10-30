const { z } = require("zod");

exports.upgradeSubscriptionSchema = z.object({
  body: z
    .object({
      plan_code: z.string().optional(),
      plan_uuid: z.string().uuid({ message: "Required" }),
      billing_cycle: z.string().optional(),
      payment_method: z.string().optional(),
      payment_details: z.record(z.any()).optional(),
      transaction_id: z.string().optional(),
    })
});
