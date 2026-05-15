const { z } = require("zod");

const loginCustomerSchema = z.object({
  body: z.object({
    token: z
      .string({
        required_error: "Token is required",
        invalid_type_error: "Token must be a string",
      })
      .min(1, "Token cannot be empty"),
  }),
});

module.exports = { loginCustomerSchema };
