const { z } = require("zod");
const { FIELD_LIMITS } = require("../../common/field-limits");

const activeDaySchema = z
  .object({
    start_time: z.string(),
    end_time: z.string(),
  })
  .nullable()
  .optional();

const docSchema = z.object({
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

const maxStaffDocs = Number(process.env.MAX_STAFF_DOCS_LIMIT) || 10;

exports.createStaffSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, "First name is required").max(FIELD_LIMITS.NAME, `First name cannot exceed ${FIELD_LIMITS.NAME} characters`),
    last_name: z.string().max(FIELD_LIMITS.NAME, `Last name cannot exceed ${FIELD_LIMITS.NAME} characters`).optional(),
    email: z.email("Invalid email address").max(FIELD_LIMITS.EMAIL, `Email cannot exceed ${FIELD_LIMITS.EMAIL} characters`),
    phone_number: z.string().min(8, "Phone number must be valid").max(FIELD_LIMITS.PHONE, `Phone number cannot exceed ${FIELD_LIMITS.PHONE} digits`),
    additional_phone_number: z.string().min(8).max(FIELD_LIMITS.PHONE, `Phone number cannot exceed ${FIELD_LIMITS.PHONE} digits`).optional(),
    dob: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "DOB must be in DD-MM-YYYY format"),
    title: z.string().min(1, "Title is required").max(FIELD_LIMITS.TITLE, `Title cannot exceed ${FIELD_LIMITS.TITLE} characters`),
    joining_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Joining date must be in DD-MM-YYYY format"),
    end_date: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, "End date must be in DD-MM-YYYY format")
      .nullable()
      .optional()
      .or(z.literal("")),
    address: z.string().max(FIELD_LIMITS.ADDRESS, `Address cannot exceed ${FIELD_LIMITS.ADDRESS} characters`),
    emergency_contact: z.object({
      name: z.string().min(1).max(FIELD_LIMITS.NAME, `Name cannot exceed ${FIELD_LIMITS.NAME} characters`),
      phone: z.string().min(8).max(FIELD_LIMITS.PHONE, `Phone cannot exceed ${FIELD_LIMITS.PHONE} digits`),
      relation: z.string().optional(),
    }),
    photos: docSchema.nullable().optional(),
    staff_docs: z.array(docSchema).max(maxStaffDocs, `Maximum ${maxStaffDocs} staff documents allowed`).nullable().optional(),
    active_hours: z
      .object({
        monday: activeDaySchema,
        tuesday: activeDaySchema,
        wednesday: activeDaySchema,
        thursday: activeDaySchema,
        friday: activeDaySchema,
        saturday: activeDaySchema,
        sunday: activeDaySchema,
      })
      .optional(),
  }),
});
