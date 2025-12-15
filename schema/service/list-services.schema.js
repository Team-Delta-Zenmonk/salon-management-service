const { z } = require('zod');

const listServicesSchema = z.object({
    query: z.object({
        category_uuid: z.uuid({ message: "Invalid category UUID" }).optional(),
    }).optional()
});

module.exports = { listServicesSchema };
