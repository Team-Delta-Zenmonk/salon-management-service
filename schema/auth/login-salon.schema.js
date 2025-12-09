const { z } = require("zod");

exports.loginSalonSchema = z.object({
    body: z.object({
        email: z.email("Invalid email").min(1, "Email is required"),
        password: z.string().min(1, "Password is required"),
    })
});
