const { z } = require("zod");

exports.listServiceStaffSchema = z.object({
    params: z.object({
        uuid: z.string().min(1, "Service uuid is required")
    })
});