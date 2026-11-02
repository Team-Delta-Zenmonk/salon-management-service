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
    .superRefine((data, ctx) => {
      const ordered = data.ordered_quantity ?? 0;
      const received = data.received_quantity ?? 0;
      const damaged = data.damaged_quantity ?? 0;
      const returned = data.returned_quantity ?? 0;

      if (ordered > 0 && received > ordered) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Received quantity cannot be greater than ordered quantity",
          path: ["received_quantity"],
        });
      }

      if (damaged > received) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Damaged quantity cannot be greater than received quantity",
          path: ["damaged_quantity"],
        });
      }

      if (returned > received) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Returned quantity cannot be greater than received quantity",
          path: ["returned_quantity"],
        });
      }
    }),
});
