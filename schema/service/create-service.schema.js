const { z } = require("zod");
const { ServiceGender, PriceType, DiscountType } = require("../../models/service/service-types");
const { FIELD_LIMITS } = require("../../common/field-limits");
const { CURRENCY_CONFIG, DEFAULT_CURRENCY } = require("../../common/currencies.config");

const serviceBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(FIELD_LIMITS.ITEM_NAME, `Name cannot exceed ${FIELD_LIMITS.ITEM_NAME} characters`),
  description: z.string().max(FIELD_LIMITS.DESCRIPTION, `Description cannot exceed ${FIELD_LIMITS.DESCRIPTION} characters`).optional(),
  category_id: z.string().optional(),
  parent_id: z.string().optional(),
  is_active: z.boolean().optional(),
  is_popular: z.boolean().optional(),
  gender: z.enum(ServiceGender.getValues(), {
    required_error: "Gender is required",
  }),
  price_type: z.enum(PriceType.getValues(), {
    required_error: "Price type is required",
  }),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(100000, "Price cannot exceed 1,00,000"),
  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100000, "Discount cannot exceed 1,00,000")
    .nullable()
    .optional(),
  discount_type: z
    .enum(DiscountType.getValues())
    .or(z.literal(""))
    .nullable()
    .optional(),
  duration: z
    .number()
    .int({ message: "Duration must be an integer" })
    .positive({ message: "Duration must be greater than 0" })
    .max(600, { message: "Duration cannot exceed 10 hours (600 minutes)" }),
});

const validateServicePricing = (data, ctx) => {
  const minPrice = CURRENCY_CONFIG[DEFAULT_CURRENCY].minServicePrice;
  const symbol = CURRENCY_CONFIG[DEFAULT_CURRENCY].symbol;

  if (data.price_type === PriceType.ENUM.FIXED || data.price_type === PriceType.ENUM.FROM) {
    if (data.price !== undefined && data.price !== null && data.price < minPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: `Price must be at least ${symbol}${minPrice} for paid services (minimum payment requirement)`,
      });
    }
  } else if (data.price_type === PriceType.ENUM.FREE) {
    if (data.price !== undefined && data.price !== null && data.price !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Price must be 0 for free service",
      });
    }
  }

  const discount = Number(data.discount || 0);
  if (discount > 0) {
    if (!data.discount_type) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_type"],
        message: "Discount type is required when discount is greater than 0",
      });
      return;
    }
    if (data.discount_type === DiscountType.ENUM.PERCENTAGE) {
      if (discount > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discount"],
          message: "Discount percentage cannot be greater than 100%",
        });
      }
    } else if (data.discount_type === DiscountType.ENUM.AMOUNT) {
      if (data.price !== undefined && data.price !== null && discount > data.price) {
        ctx.addIssue({
          code: "custom",
          path: ["discount"],
          message: "Discount amount cannot exceed the service price",
        });
      }
    }
  }
};

exports.serviceBodySchema = serviceBodySchema;
exports.validateServicePricing = validateServicePricing;
exports.validateServiceDiscount = validateServicePricing;

exports.createServiceSchema = z.object({
  body: serviceBodySchema.superRefine(validateServicePricing),
});
