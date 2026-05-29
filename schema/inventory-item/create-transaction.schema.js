const { z } = require("zod");

const baseFields = {
  ordered_quantity: z.coerce.number().nonnegative(),
  received_quantity: z.coerce.number().nonnegative(),
  damaged_quantity: z.coerce.number().nonnegative(),
  returned_quantity: z.coerce.number().nonnegative(),
  bill_amount: z.coerce.number().nonnegative().nullable().optional(),
  ordered_date: z.coerce.date({
    required_error: "Ordered date is required",
    invalid_type_error: "Invalid ordered date",
  }),
  received_date: z.coerce.date({
    required_error: "Received date is required",
    invalid_type_error: "Invalid received date",
  }),
};

const validateQuantities = (data) => {
  if (data.ordered_quantity > 0 && data.received_quantity > data.ordered_quantity) {
    return false;
  }
  const totalRemoved = (data.damaged_quantity || 0) + (data.returned_quantity || 0);
  if (totalRemoved > data.received_quantity) {
    return false;
  }
  return true;
};

exports.createTransactionSchema = z.object({
  body: z
    .object({
      ...baseFields,
      ordered_quantity: baseFields.ordered_quantity.default(0),
      received_quantity: baseFields.received_quantity.default(0),
      damaged_quantity: baseFields.damaged_quantity.default(0),
      returned_quantity: baseFields.returned_quantity.default(0),
      item_uuid: z.string().uuid({ message: "Valid Item UUID is required" }),
    })
    .refine(validateQuantities, {
      message: "Quantities are physically impossible.",
      path: ["received_quantity"],
    }),
});
