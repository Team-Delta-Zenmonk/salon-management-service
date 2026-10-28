const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");
const { CURRENCY_CONFIG, DEFAULT_CURRENCY } = require("../../common/currencies.config");

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
        .refine((val) => !val || val.toLowerCase().trim() !== "trial", {
          message: "Cannot create a plan with reserved code 'trial'",
        })
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
      const normalizedCode = data.code?.toLowerCase().trim();
      const normalizedName = data.name?.toLowerCase().trim();
      if (normalizedCode === "trial" || (!data.code && normalizedName === "trial")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["code"],
          message: "Plan code 'trial' is a reserved system tier and cannot be created",
        });
      }
      const minAmount = CURRENCY_CONFIG[DEFAULT_CURRENCY].minChargeAmount;
      const symbol = CURRENCY_CONFIG[DEFAULT_CURRENCY].symbol;
      if (data.amount < minAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: `Plan price amount must be at least ${symbol}${minAmount} for custom paid plans (minimum payment requirement)`,
        });
      }
    }),
});

exports.updatePlanSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: "Plan name cannot be empty" })
        .max(FIELD_LIMITS.NAME, { message: `Plan name cannot exceed ${FIELD_LIMITS.NAME} characters` })
        .optional(),
      amount: z
        .number({ invalid_type_error: "Amount must be a number" })
        .min(0, { message: "Price amount cannot be negative" })
        .optional(),
      duration_days: z
        .number({ invalid_type_error: "Duration days must be a number" })
        .int({ message: "Duration days must be an integer" })
        .min(1, { message: "Duration must be at least 1 day" })
        .optional(),
      billing_cycle: z
        .string()
        .trim()
        .max(FIELD_LIMITS.CODE, { message: `Billing cycle cannot exceed ${FIELD_LIMITS.CODE} characters` })
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
      if (data.amount !== undefined) {
        const minAmount = CURRENCY_CONFIG[DEFAULT_CURRENCY].minChargeAmount;
        const symbol = CURRENCY_CONFIG[DEFAULT_CURRENCY].symbol;
        if (data.amount < minAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["amount"],
            message: `Plan price amount must be at least ${symbol}${minAmount} for paid plans (minimum payment requirement)`,
          });
        }
      }
    }),
  params: z.object({
    code: z.string().min(1, "Plan code is required"),
  }),
});
