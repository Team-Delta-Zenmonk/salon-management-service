const { z } = require("zod");

const activeDaySchema = z
  .object({
    start_time: z.string(),
    end_time: z.string(),
  })
  .nullable()
  .optional();

exports.createStaffSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, "First name is required"),

    last_name: z.string().optional(),

    email: z.email("Invalid email address"),

    phone_number: z.string().min(8, "Phone number must be valid"),

    additional_phone_number: z.string().min(8).optional(),

    dob: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, "DOB must be in DD-MM-YYYY format"),

    title: z.string().min(1, "Title is required"),

    joining_date: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, "Joining date must be in DD-MM-YYYY format"),

    end_date: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, "End date must be in DD-MM-YYYY format")
      .optional(),

    address: z.string(),

    emergency_contact: z.object({
      name: z.string().min(1),
      phone: z.string().min(8),
      relation: z.string().optional(),
    }),

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
