const { z } = require('zod');

const baseFields = {
    ordered_quantity: z.coerce.number().nonnegative(),
    received_quantity: z.coerce.number().nonnegative(),
    damaged_quantity: z.coerce.number().nonnegative(),
    returned_quantity: z.coerce.number().nonnegative(),
    bill_amount: z.coerce.number().nonnegative().nullable().optional(),
    ordered_date: z.coerce.date().nullable().optional(),
    received_date: z.coerce.date().nullable().optional()
};

exports.updateTransactionSchema = z.object({
    body: z.object({
        ...baseFields,
        item_uuid: z.string().uuid().optional()
    }).partial().refine((data) => {
        return true;
    }),
    params: z.object({
        uuid: z.string().uuid()
    })
});
