const cloudinary = require("./config");

const syncPresets = async () => {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log("Cloudinary credentials not provided, skipping preset initialization.");
    return;
  }

  const presets = [
    {
      name: process.env.CLOUDINARY_IMAGE_PRESET || "image_preset",
      max_file_size: (Number(process.env.MAX_IMAGE_SIZE_MB) || 5) * 1024 * 1024,
      allowed_formats: (process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp,image/gif")
        .split(",")
        .map((t) => t.replace("image/", "").trim())
        .join(","),
    },
    {
      name: process.env.CLOUDINARY_DOC_PRESET || "doc_preset",
      max_file_size: (Number(process.env.MAX_DOC_SIZE_MB) || 15) * 1024 * 1024,
      allowed_formats: "pdf,doc,docx,txt",
    },
  ];

  for (const preset of presets) {
    try {
      await cloudinary.api.update_upload_preset(preset.name, {
        unsigned: false,
        max_file_size: preset.max_file_size,
        allowed_formats: preset.allowed_formats,
      });

      const livePreset = await cloudinary.api.upload_preset(preset.name);
      console.log(`Cloudinary preset '${preset.name}' updated successfully`);
    } catch (err) {
      if (err?.error?.http_code === 404 || err?.message?.includes("Can't find")) {
        try {
          await cloudinary.api.create_upload_preset({
            name: preset.name,
            unsigned: false,
            max_file_size: preset.max_file_size,
            allowed_formats: preset.allowed_formats,
          });
          console.log(`Cloudinary preset '${preset.name}' created successfully`);
        } catch (createErr) {
          console.warn(`Failed to create Cloudinary preset '${preset.name}':`, createErr?.message || createErr);
        }
      } else {
        console.warn(`Cloudinary preset '${preset.name}' update warning:`, err?.message || err);
      }
    }
  }
};

module.exports = { syncPresets };
