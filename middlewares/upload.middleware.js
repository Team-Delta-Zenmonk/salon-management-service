const multer = require("multer");
const { BAD_REQUEST } = require("../libs/constants");
const upload = multer({ storage: multer.memoryStorage() });

exports.uploadFilesMiddleware = (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (error) {
      console.error(error);
      return res.status(BAD_REQUEST).json({
        message: "File upload error",
        error: error.message,
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(BAD_REQUEST).json({ message: "No files uploaded" });
    }

    next();
  });
};
