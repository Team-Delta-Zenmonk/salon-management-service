const { z } = require("zod");
const {
  discountDetailsObject,
} = require("./create-subscription-invoice.schema");

exports.onboardSalonSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Salon name is required" }).trim().min(1, {
      message: "Salon name cannot be empty",
    }),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email({ message: "Invalid email address" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters" }),
    phone: z.string().trim().optional().nullable(),
    slug: z.string().trim().optional().nullable(),
    trial_days: z.number().min(0).optional().nullable(),
    subscription_plan: z.string().optional().nullable(),
    plan: z.enum(["monthly", "yearly"]).optional().nullable(),
    amount: z
      .number({
        invalid_type_error: "amount must be a number",
      })
      .positive({
        message: "amount must be a positive number",
      })
      .optional()
      .nullable(),
    discount_details: discountDetailsObject.nullable().optional(),
  }),
});
