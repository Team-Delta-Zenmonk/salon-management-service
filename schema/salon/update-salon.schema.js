const { z } = require("zod");
const { SalonType } = require("../../models/salon/salon-types");

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
    })
});