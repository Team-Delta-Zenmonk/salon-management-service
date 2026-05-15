const { z } = require("zod");
const { createServiceSchema } = require("./create-service.schema");

exports.updateServiceSchema = z.object({
  body: createServiceSchema.shape.body.partial(),
  params: z.object({
    uuid: z.string().min(1, "Service uuid is required"),
  }),
});
