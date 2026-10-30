const { z } = require("zod");

exports.subscriptionIntentSchema = z.object({
  body: z
    .object({
      plan_uuid: z.string().uuid({ message: "Required" }),
    })

});
