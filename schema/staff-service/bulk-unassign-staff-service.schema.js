const { z } = require('zod');

const bulkUnassignStaffServiceSchema = z.object({
  body: z.object({
    staff_services: z.array(
      z.string().uuid({ message: "Invalid staff_service UUID" })
    ),
  }),
});

module.exports = { bulkUnassignStaffServiceSchema };


