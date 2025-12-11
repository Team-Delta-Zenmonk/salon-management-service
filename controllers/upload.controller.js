const { uploadService } = require("../services");
const { SUCCESS } = require("../libs/constants");

exports.uploadImages = async (req, res, next) => {
  try {
    const response = await Promise.all(req.files.map((file) => uploadService.uploadImages({file, folder:req.body.folder})));
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller uploadImages", error);
    return next(error);
  }
};
