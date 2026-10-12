const { z } = require("zod");

exports.themeIntentSchema = z.object({
  body: z.object({
    theme_uuid: z.string().uuid("Valid theme UUID is required"),
  }),
});

exports.activateThemeSchema = z.object({
  body: z.object({
    theme_uuid: z.string().uuid("Valid theme UUID is required"),
  }),
});
