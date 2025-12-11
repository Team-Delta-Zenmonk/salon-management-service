const { cloudinary } = require("../config");

exports.uploadImages = async (payload) => {
  const { file, folder } = payload;
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: `${process.env.CLOUDINARY_FOLDER}/${folder}`,
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    resource_type: result.resource_type,
    bytes: result.bytes,
    type: result.type,
    secure_url: result.secure_url,
    asset_folder: result.asset_folder,
    filename: file.originalname,
  };
};
