const router = require("express").Router();
const { salonController, customerController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { authCustomerMiddleware } = require("../middlewares/auth.middleware");
const { getAvailableSlotsSchema } = require("../schema/customer/get-available-slots.schema");
const { getCustomerCartSchema } = require("../schema/customer/get-customer-cart.schema");
const { updateCustomerProfileSchema } = require("../schema/customer/update-customer-profile.schema");
const { generatePresignedUrlSchema } = require("../schema/upload/generate-presigned-url.schema");

router.get("/available-slots", validate(getAvailableSlotsSchema), salonController.getAvailableSlots);
router.post("/upload/presigned-url", authCustomerMiddleware, validate(generatePresignedUrlSchema), customerController.generateCustomerPresignedUrl);
router.patch("/profile", authCustomerMiddleware, validate(updateCustomerProfileSchema), customerController.updateCustomerProfile);
router.get("/:uuid/cart", validate(getCustomerCartSchema), customerController.getCustomerCart);

module.exports = router;
