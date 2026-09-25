const { z } = require("zod");
const { serviceBodySchema, validateServiceDiscount } = require("./create-service.schema");

exports.updateServiceSchema = z.object({
  body: serviceBodySchema.partial().superRefine(validateServiceDiscount),
  params: z.object({
    uuid: z.string().min(1, "Service uuid is required"),
  }),
});
