const { cloudinary } = require("../config");
const { error } = require("../libs");

const parseEnvList = (envVar, defaultValue) =>
  (envVar || defaultValue)
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const GLOBAL_MAX_FILES_LIMIT = Number(process.env.MAX_FILES_UPLOAD_LIMIT) || 10;

const PRESETS_BY_CATEGORY = {
  image: process.env.CLOUDINARY_IMAGE_PRESET || "image_preset",
  document: process.env.CLOUDINARY_DOC_PRESET || "doc_preset",
};

const SIZE_LIMITS_BY_CATEGORY = {
  image: (Number(process.env.MAX_IMAGE_SIZE_MB) || 5) * 1024 * 1024,
  document: (Number(process.env.MAX_DOC_SIZE_MB) || 15) * 1024 * 1024,
};

const ALLOWED_TYPES_BY_CATEGORY = {
  image: parseEnvList(process.env.ALLOWED_IMAGE_TYPES, "image/jpeg,image/png,image/webp,image/gif"),
  document: parseEnvList(
    process.env.ALLOWED_DOC_TYPES,
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
  ),
};

const mimeToFormats = (mimeList) =>
  mimeList
    .map((mime) => {
      if (mime === "application/pdf") return "pdf";
      if (mime.startsWith("image/")) return mime.replace("image/", "");
      if (mime.includes("msword")) return "doc";
      if (mime.includes("wordprocessingml")) return "docx";
      if (mime === "text/plain") return "txt";
      return null;
    })
    .filter(Boolean);

const getCategoryForMimeType = (mimeType) => {
  const normalized = mimeType.toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  return "document";
};

exports.generatePresignedUrls = async (payload) => {
  const { files } = payload;

  if (files.length > GLOBAL_MAX_FILES_LIMIT) {
    throw new error.BadRequest(
      `Exceeded maximum batch upload limit of ${GLOBAL_MAX_FILES_LIMIT} files per request.`
    );
  }

  const results = [];

  for (const item of files) {
    const { filename, filetype, folder } = item;
    const normalizedType = filetype.toLowerCase();
    const category = getCategoryForMimeType(normalizedType);

    const allowedTypesForCategory = ALLOWED_TYPES_BY_CATEGORY[category];
    const maxSizeBytes = SIZE_LIMITS_BY_CATEGORY[category];
    const uploadPreset = PRESETS_BY_CATEGORY[category];

    if (allowedTypesForCategory && allowedTypesForCategory.length > 0 && !allowedTypesForCategory.includes(normalizedType)) {
      throw new error.BadRequest(
        `File type '${filetype}' is not allowed. Allowed ${category} types: ${allowedTypesForCategory.join(", ")}`
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const targetFolder = `${process.env.CLOUDINARY_FOLDER || "salon-uploads"}/${folder || "general"}`;
    const resourceType = category === "image" ? "image" : "raw";
    const allowedFormatsStr = allowedTypesForCategory ? mimeToFormats(allowedTypesForCategory).join(",") : "";

    const paramsToSign = {
      folder: targetFolder,
      timestamp,
      upload_preset: uploadPreset,
    };

    if (allowedFormatsStr) {
      paramsToSign.allowed_formats = allowedFormatsStr;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    results.push({
      filename,
      filetype,
      category,
      resource_type: resourceType,
      upload_url: uploadUrl,
      params: {
        api_key: process.env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        folder: targetFolder,
        upload_preset: uploadPreset,
        allowed_formats: allowedFormatsStr,
        max_file_size: maxSizeBytes,
        allowed_types: allowedTypesForCategory,
      },
    });
  }

  return {
    success: true,
    data: results,
  };
};
