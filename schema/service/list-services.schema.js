const { z } = require('zod');

const listServicesSchema = z.object({
    query: z.object({
        category_uuid: z.uuid({ message: "Invalid category UUID" }).optional(),
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).default(10).optional(),
        offset: z.coerce.number().int().min(0).optional(),
    }).optional()
});

module.exports = { listServicesSchema };
