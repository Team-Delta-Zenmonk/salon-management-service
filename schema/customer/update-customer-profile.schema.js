const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.updateCustomerProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Name cannot be empty")
        .max(FIELD_LIMITS.NAME, `Name cannot exceed ${FIELD_LIMITS.NAME} characters`)
        .optional(),
      phone_number: z
        .string()
        .trim()
        .max(FIELD_LIMITS.PHONE, `Phone number cannot exceed ${FIELD_LIMITS.PHONE} digits`)
        .nullable()
        .optional(),
      gender: z.string().trim().max(50).nullable().optional(),
      profile_image: z
        .string()
        .trim()
        .url("Profile image must be a valid URL")
        .max(FIELD_LIMITS.URL, `Profile image URL cannot exceed ${FIELD_LIMITS.URL} characters`)
        .nullable()
        .optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.phone_number !== undefined ||
        data.gender !== undefined ||
        data.profile_image !== undefined,
      {
        message: "At least one field (name, phone_number, gender, or profile_image) must be provided for update",
      }
    ),
});
