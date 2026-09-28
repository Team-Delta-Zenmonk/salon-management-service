const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.initOnboardingSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(FIELD_LIMITS.NAME, `Name cannot exceed ${FIELD_LIMITS.NAME} characters`),
    email: z.email("Invalid email").min(1, "Email is required").max(FIELD_LIMITS.EMAIL, `Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(FIELD_LIMITS.PASSWORD, `Password cannot exceed ${FIELD_LIMITS.PASSWORD} characters`)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  }),
});
