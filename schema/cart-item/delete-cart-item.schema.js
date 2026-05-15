const { z } = require("zod");

exports.deleteCartItemSchema = z.object({
  params: z.object({
    uuid: z.string().uuid({ message: "Invalid UUID format" }),
  }),
});
