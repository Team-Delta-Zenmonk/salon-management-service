const { z } = require("zod");

exports.getCartSchema = z.object({
  params: z.object({
    uuid: z.string().uuid({ message: "Invalid UUID format" }),
  }),
});
