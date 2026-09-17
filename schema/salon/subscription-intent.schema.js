const { z } = require("zod");

exports.subscriptionIntentSchema = z.object({
  body: z.object({
    plan: z.enum(["monthly", "yearly"], {
      message: "Plan must be 'monthly' or 'yearly'",
    }),
  }),
});
