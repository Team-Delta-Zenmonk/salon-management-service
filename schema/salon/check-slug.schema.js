const { z } = require("zod");

exports.checkSlugSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(50, "Slug cannot exceed 50 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens (no leading, trailing, or double hyphens)"
      ),
  }),
});
