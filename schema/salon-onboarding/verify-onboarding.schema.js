const { z } = require("zod");

exports.verifyOnboardingSchema = z.object({
    body: z.object({
        email: z.email("Invalid email").min(1, "Email is required"),
        otp: z.string().min(1, "OTP is required")
    })
});