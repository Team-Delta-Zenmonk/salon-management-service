const { z } = require("zod");
const {
  SubscriptionDiscountType,
} = require("../../models/subscription-invoice/subscription-invoice-types");

const discountDetailsObject = z
  .object(
    {
      type: z.enum(
        [
          SubscriptionDiscountType.ENUM.MANUAL,
          SubscriptionDiscountType.ENUM.PERCENTAGE,
        ],
        {
          required_error: "discount_details.type is required when discount_details is provided",
          invalid_type_error: "discount_details.type must be either 'manual' or 'percentage'",
        },
      ),
      value: z
        .number({
          required_error: "discount_details.value is required when discount_details is provided",
          invalid_type_error: "discount_details.value must be a number",
        })
        .min(0, {
          message: "discount_details.value must be non-negative",
        }),
    },
    {
      required_error: "discount_details must be an object containing type and value",
    },
  )
  .refine(
    (data) => {
      if (data.type === SubscriptionDiscountType.ENUM.PERCENTAGE) {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount value cannot exceed 100%",
      path: ["value"],
    },
  );

exports.createSubscriptionInvoiceSchema = z.object({
  body: z.object({
    salon_id: z.union([z.number(), z.string()], {
      required_error: "salon_id is required",
    }),
    plan: z.enum(["monthly", "yearly"], {
      required_error: "plan is required and must be either 'monthly' or 'yearly'",
    }),
    amount: z
      .number({
        required_error: "amount is required",
      })
      .positive({
        message: "amount must be a positive number",
      }),
    discount_details: discountDetailsObject.nullable().optional(),
  }),
});

exports.discountDetailsObject = discountDetailsObject;
