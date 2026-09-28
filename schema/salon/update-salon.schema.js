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
  url: z.url(),
  public_id: z.string(),
  format: z.string().optional(),
  resource_type: z.string().optional(),
  bytes: z.number().optional(),
  type: z.string().optional(),
  secure_url: z.url(),
  asset_folder: z.string().optional(),
  filename: z.string(),
});

exports.updateSalonSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(FIELD_LIMITS.NAME, `Name cannot exceed ${FIELD_LIMITS.NAME} characters`).optional(),
    email: z.email("Invalid email").min(1, "Email is required").max(FIELD_LIMITS.EMAIL, `Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`).optional(),
    phone: z.string().max(FIELD_LIMITS.PHONE, `Phone cannot exceed ${FIELD_LIMITS.PHONE} digits`).optional(),
    about: z.string().max(FIELD_LIMITS.DESCRIPTION, `About cannot exceed ${FIELD_LIMITS.DESCRIPTION} characters`).optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    address: z.string().max(FIELD_LIMITS.ADDRESS, `Address cannot exceed ${FIELD_LIMITS.ADDRESS} characters`).optional(),
    owner_name: z.string().max(FIELD_LIMITS.NAME, `Owner name cannot exceed ${FIELD_LIMITS.NAME} characters`).optional(),
    type: z.enum(SalonType.getValues(), { message: "Invalid salon type" }).optional(),
    map_link: z.string().max(FIELD_LIMITS.URL, `Map link cannot exceed ${FIELD_LIMITS.URL} characters`).optional(),
    logo: z.string().optional(),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(FIELD_LIMITS.SLUG, `Slug cannot exceed ${FIELD_LIMITS.SLUG} characters`)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      )
      .optional(),
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
    subscription_plan: z.enum(SubscriptionPlan.getValues()).optional(),
  }),
});
