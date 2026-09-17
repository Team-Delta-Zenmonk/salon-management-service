const { z } = require("zod");

const fileItemSchema = z.object({
  filename: z.string().optional(),
  filetype: z.string().min(1, "Filetype is required"),
  folder: z.string().optional(),
});

exports.generatePresignedUrlSchema = z.object({
  body: z.object({
    files: z.array(fileItemSchema).min(1, "At least one file item is required"),
  }),
});
