const router = require("express").Router();
const { adminController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
const { validate } = require("../middlewares/validate.middleware");
const {
  onboardSalonSchema,
} = require("../schema/admin/onboard-salon.schema");
const {
  createPlanSchema,
  updatePlanSchema,
} = require("../schema/admin/create-plan.schema");

router.post("/auth/login", adminController.loginAdmin);
router.get("/plans", adminController.getSubscriptionPlans);
router.post("/plans", validate(createPlanSchema), adminController.createSubscriptionPlan);
router.post("/auth/refresh", adminController.refreshAdmin);
router.use(authMiddleware.authAdminMiddleware);
router.get("/salons", adminController.listSalons);
router.post("/salons/onboard",validate(onboardSalonSchema),adminController.onboardSalon);
router.patch("/salons/:uuid/status", adminController.updateSalonStatus);
router.patch("/salons/:uuid/plan", adminController.updateSalonPlan);
router.patch("/plans/:uuid", validate(updatePlanSchema), adminController.updateSubscriptionPlan);
router.put("/plans/:uuid", validate(updatePlanSchema), adminController.updateSubscriptionPlan);
router.patch("/plans/:uuid/status", adminController.toggleSubscriptionPlanStatus);
router.delete("/plans/:uuid", adminController.deleteSubscriptionPlan);

module.exports = router;
