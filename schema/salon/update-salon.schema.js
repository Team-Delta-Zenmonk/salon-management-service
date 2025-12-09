const { z } = require("zod");
const { SalonType } = require("../../models/salon/salon-types");

exports.updateSalonSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email").min(1, "Email is required"),
        phone: z.string(),
        about: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        address: z.string(),
        owner_name: z.string(),
        type: z.enum(SalonType.getValues(), { message: "Invalid salon type" }),
        map_link: z.string(),
        logo: z.string(),
    })
});