const router = require("express").Router();
const { adminController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
const { validate } = require("../middlewares/validate.middleware");
const {
  onboardSalonSchema,
} = require("../schema/admin/onboard-salon.schema");

router.post("/auth/login", adminController.loginAdmin);
router.get("/plans", adminController.getSubscriptionPlans);
router.post("/auth/refresh", adminController.refreshAdmin);
router.use(authMiddleware.authAdminMiddleware);
router.get("/salons", adminController.listSalons);
router.post("/salons/onboard",validate(onboardSalonSchema),adminController.onboardSalon);
router.patch("/salons/:uuid/status", adminController.updateSalonStatus);
router.patch("/salons/:uuid/plan", adminController.updateSalonPlan);
router.patch("/plans/:code", adminController.updateSubscriptionPlan);
router.put("/plans/:code", adminController.updateSubscriptionPlan);

module.exports = router;
