const { z } = require("zod");

exports.resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
        password: z.string().min(1, "Password is required"),
    })
});