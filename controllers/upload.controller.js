const { uploadService } = require("../services");
const { SUCCESS } = require("../libs/constants");

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const folder = req.body.folder;
    const results = await Promise.all(req.files.map((file) => uploadService.uploadImages(file, folder)));
    return res.status(SUCCESS).json(results.length === 1 ? results[0] : { data: results });
  } catch (err) {
    console.log("Error in controller uploadImages", err);
    return next(err);
  }
};
