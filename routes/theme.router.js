const router = require("express").Router();
const { authMiddleware } = require("../middlewares");
const { themeController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const {
  themeIntentSchema,
  activateThemeSchema,
} = require("../schema/theme/theme.schema");

router.get("/", authMiddleware.authSalonMiddleware, themeController.getThemes);
router.post(
  "/intent",
  authMiddleware.authSalonMiddleware,
  validate(themeIntentSchema),
  themeController.createPaymentIntent
);
router.patch(
  "/active",
  authMiddleware.authSalonMiddleware,
  validate(activateThemeSchema),
  themeController.activateTheme
);

module.exports = router;

