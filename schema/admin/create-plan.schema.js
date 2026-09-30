const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.createPlanSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Plan name is required" })
        .trim()
        .min(1, { message: "Plan name cannot be empty" })
        .max(FIELD_LIMITS.NAME, { message: `Plan name cannot exceed ${FIELD_LIMITS.NAME} characters` }),
      amount: z
        .number({ required_error: "Price amount is required", invalid_type_error: "Amount must be a number" })
        .min(0, { message: "Price amount cannot be negative" }),
      duration_days: z
        .number({ required_error: "Duration days is required", invalid_type_error: "Duration days must be a number" })
        .int({ message: "Duration days must be an integer" })
        .min(1, { message: "Duration must be at least 1 day" }),
      code: z
        .string()
        .trim()
        .max(FIELD_LIMITS.CODE, { message: `Code cannot exceed ${FIELD_LIMITS.CODE} characters` })
        .optional()
        .nullable(),
      billing_cycle: z
        .string()
        .trim()
        .max(FIELD_LIMITS.CODE, { message: `Billing cycle cannot exceed ${FIELD_LIMITS.CODE} characters` })
        .optional()
        .nullable(),
      badge: z
        .string()
        .trim()
        .max(FIELD_LIMITS.CODE, { message: `Badge cannot exceed ${FIELD_LIMITS.CODE} characters` })
        .optional()
        .nullable(),
      description: z
        .string()
        .trim()
        .max(FIELD_LIMITS.DESCRIPTION, { message: `Description cannot exceed ${FIELD_LIMITS.DESCRIPTION} characters` })
        .optional()
        .nullable(),
    })
    .superRefine((data, ctx) => {
      const isFreeTier = data.code?.toLowerCase().trim() === "trial";
      if (!isFreeTier && data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Price amount 0 is only allowed for the free trial tier (code: trial)",
        });
      }
    }),
});
