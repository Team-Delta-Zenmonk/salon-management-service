const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { uploadController } = require("../controllers");
const { authMiddleware } = require("../middlewares");

router.post( "/", authMiddleware.authSalonMiddleware, upload.any(), uploadController.uploadImages );

module.exports = router;
