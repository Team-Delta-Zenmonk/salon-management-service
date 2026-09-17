const { uploadService } = require("../services");
const { SUCCESS } = require("../libs/constants");

exports.generatePresignedUrls = async (req, res, next) => {
  try {
    const response = await uploadService.generatePresignedUrls({ files: req.body.files });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller generatePresignedUrls", error);
    return next(error);
  }
};
