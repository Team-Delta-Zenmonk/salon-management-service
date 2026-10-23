const { z } = require("zod");

exports.subscriptionIntentSchema = z.object({
  body: z.object({
    plan: z.string({ required_error: "Plan code is required" }).min(1, { message: "Plan code is required" }),
  }),
});
