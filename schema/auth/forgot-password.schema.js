const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").min(1, "Email is required").max(FIELD_LIMITS.EMAIL, `Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`),
  }),
});
