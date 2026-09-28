const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.loginSalonSchema = z.object({
  body: z.object({
    email: z.email("Invalid email").min(1, "Email is required").max(FIELD_LIMITS.EMAIL, `Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`),
    password: z.string().min(1, "Password is required").max(FIELD_LIMITS.PASSWORD, `Password cannot exceed ${FIELD_LIMITS.PASSWORD} characters`),
  }),
});
