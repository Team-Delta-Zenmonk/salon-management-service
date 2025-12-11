const { z } = require("zod");
const { SalonType } = require("../../models/salon/salon-types");

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
  filename: z.string()
});

exports.updateSalonSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").optional(),
        email: z.email("Invalid email").min(1, "Email is required").optional(),
        phone: z.string().optional(),
        about: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        address: z.string().optional(),
        owner_name: z.string().optional(),
        type: z.enum(SalonType.getValues(), { message: "Invalid salon type" }).optional(),
        map_link: z.string().optional(),
        logo: z.string().optional(),
        photos: z.array(photoSchema).optional(),
        business_hours: z.object({
            monday: businessDaySchema,
            tuesday: businessDaySchema,
            wednesday: businessDaySchema,
            thursday: businessDaySchema,
            friday: businessDaySchema,
            saturday: businessDaySchema,
            sunday: businessDaySchema,
        }).optional()
    })
});