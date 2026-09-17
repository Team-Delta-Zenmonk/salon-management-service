const router = require("express").Router();
const { uploadController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
const { validate } = require("../middlewares/validate.middleware");
const { generatePresignedUrlSchema } = require("../schema/upload/generate-presigned-url.schema");

router.post(
  "/presigned-url",
  authMiddleware.authSalonMiddleware,
  validate(generatePresignedUrlSchema),
  uploadController.generatePresignedUrls
);

module.exports = router;
