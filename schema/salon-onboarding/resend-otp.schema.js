const { z } = require("zod");

exports.resendOtpSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").min(1, "Email is required"),
  }),
});
