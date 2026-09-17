const router = require("express").Router();
const { storefrontController, salonController } = require("../controllers");

router.get("/:slug/profile", storefrontController.getStorefrontProfile);
router.get("/:slug/services", storefrontController.getStorefrontServices);
router.get("/:slug/staff", storefrontController.getStorefrontStaff);
router.get("/:slug/slots", salonController.getAvailableSlots);

module.exports = router;
