const { z } = require('zod');

const unassignStaffServiceSchema = z.object({
    params: z.object({
        staff_uuid: z.string().uuid({ message: "Invalid staff UUID" }),
        service_uuid: z.string().uuid({ message: "Invalid service UUID" }),
    })
});

module.exports = { unassignStaffServiceSchema };
