const { z } = require("zod");
const { serviceBodySchema, validateServicePricing } = require("./create-service.schema");

exports.updateServiceSchema = z.object({
  body: serviceBodySchema.partial().superRefine(validateServicePricing),
  params: z.object({
    uuid: z.string().min(1, "Service uuid is required"),
  }),
});
