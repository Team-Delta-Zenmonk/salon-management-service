const router = require("express").Router();
const { uploadController } = require("../controllers");
const { authMiddleware, uploadMiddleware } = require("../middlewares");

router.post("/", authMiddleware.authSalonMiddleware, uploadMiddleware.uploadFilesMiddleware, uploadController.uploadImages );

module.exports = router;
