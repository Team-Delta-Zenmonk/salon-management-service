const { z } = require("zod");

const baseFields = {
  ordered_quantity: z.coerce.number().nonnegative(),
  received_quantity: z.coerce.number().nonnegative(),
  damaged_quantity: z.coerce.number().nonnegative(),
  returned_quantity: z.coerce.number().nonnegative(),
  bill_amount: z.coerce.number().nonnegative().nullable().optional(),
  ordered_date: z.coerce.date().nullable().optional(),
  received_date: z.coerce.date().nullable().optional(),
};

exports.updateTransactionSchema = z.object({
  body: z
    .object({
      ...baseFields,
      item_uuid: z.string().uuid().optional(),
    })
    .partial()
    .superRefine((data, ctx) => {
      const ordered = data.ordered_quantity;
      const received = data.received_quantity;
      const damaged = data.damaged_quantity;
      const returned = data.returned_quantity;

      if (ordered !== undefined && received !== undefined && ordered > 0 && received > ordered) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Received quantity cannot be greater than ordered quantity",
          path: ["received_quantity"],
        });
      }

      if (damaged !== undefined && received !== undefined && damaged > received) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Damaged quantity cannot be greater than received quantity",
          path: ["damaged_quantity"],
        });
      }

      if (returned !== undefined && received !== undefined && returned > received) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Returned quantity cannot be greater than received quantity",
          path: ["returned_quantity"],
        });
      }
    }),
  params: z.object({
    uuid: z.string().uuid(),
  }),
});
