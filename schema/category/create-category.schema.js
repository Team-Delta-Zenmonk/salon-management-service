const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required").max(FIELD_LIMITS.ITEM_NAME, `Category name cannot exceed ${FIELD_LIMITS.ITEM_NAME} characters`),
    description: z.string().max(FIELD_LIMITS.DESCRIPTION, `Description cannot exceed ${FIELD_LIMITS.DESCRIPTION} characters`).optional(),
    logo: z.string().optional(),
  }),
});
