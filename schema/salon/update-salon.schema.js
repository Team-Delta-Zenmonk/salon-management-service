const { z } = require("zod");
const { SalonType, PaymentPolicy, SubscriptionPlan } = require("../../models/salon/salon-types");
const { FIELD_LIMITS } = require("../../common/field-limits");

const businessDaySchema = z
  .object({
    start_time: z.string(),
    end_time: z.string(),
  })
  .nullable()
  .optional();

const photoSchema = z.object({
  url: z.string().url("Valid photo URL is required"),
  public_id: z.string(),
  format: z
    .string()
    .optional()
    .refine(
      (fmt) =>
        !fmt ||
        ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(
          fmt.toLowerCase()
        ),
      {
        message:
          "Only image formats (jpg, jpeg, png, webp, gif, svg) are allowed for salon photos",
      }
    ),
  resource_type: z.literal("image", {
    message: "Resource type must be image for salon photos",
  }),
  bytes: z.number().optional(),
  type: z.string().optional(),
  secure_url: z.string().url("Valid secure photo URL is required"),
  asset_folder: z.string().optional(),
  filename: z.string().optional(),
});

exports.updateSalonSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(FIELD_LIMITS.NAME, `Name cannot exceed ${FIELD_LIMITS.NAME} characters`).optional(),
    email: z.email("Invalid email").min(1, "Email is required").max(FIELD_LIMITS.EMAIL, `Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`).optional(),
    phone: z.string().max(FIELD_LIMITS.PHONE, `Phone cannot exceed ${FIELD_LIMITS.PHONE} digits`).optional(),
    about: z.string().max(FIELD_LIMITS.DESCRIPTION, `About cannot exceed ${FIELD_LIMITS.DESCRIPTION} characters`).optional(),
    latitude: z.union([z.string(), z.number()]).nullable().optional(),
    longitude: z.union([z.string(), z.number()]).nullable().optional(),
    address: z
      .union([
        z.string().max(500),
        z.object({
          street: z.string().max(FIELD_LIMITS.ADDRESS).nullable().optional(),
          city: z.string().max(FIELD_LIMITS.CITY_STATE).nullable().optional(),
          state: z.string().max(FIELD_LIMITS.CITY_STATE).nullable().optional(),
          pincode: z.string().max(FIELD_LIMITS.PINCODE).nullable().optional(),
          formatted_address: z.string().max(500).nullable().optional(),
        }),
      ])
      .nullable()
      .optional(),
    owner_name: z.string().max(FIELD_LIMITS.NAME, `Owner name cannot exceed ${FIELD_LIMITS.NAME} characters`).optional(),
    type: z.enum(SalonType.getValues(), { message: "Invalid salon type" }).optional(),
    map_link: z.string().max(FIELD_LIMITS.URL, `Map link cannot exceed ${FIELD_LIMITS.URL} characters`).nullable().optional(),
    logo: z.string().url("Logo must be a valid URL").max(FIELD_LIMITS.URL, `Logo URL cannot exceed ${FIELD_LIMITS.URL} characters`).nullable().optional(),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(FIELD_LIMITS.SLUG, `Slug cannot exceed ${FIELD_LIMITS.SLUG} characters`)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      )
      .optional(),
    theme_uuid: z.string().uuid("Valid theme UUID is required").optional(),
    is_onboarded: z.boolean().optional(),
    allowed_payment_policies: z.array(z.enum(PaymentPolicy.getValues()), { message: "Invalid allowed payment policies" }).min(1, "At least one payment policy must be enabled").optional(),
    deposit_percentage: z.number().min(1).max(100).nullable().optional(),
    photos: z.array(photoSchema).optional(),
    business_hours: z
      .object({
        monday: businessDaySchema,
        tuesday: businessDaySchema,
        wednesday: businessDaySchema,
        thursday: businessDaySchema,
        friday: businessDaySchema,
        saturday: businessDaySchema,
        sunday: businessDaySchema,
      })
      .optional(),
    subscription_plan: z.string().optional(),
  }),
});
