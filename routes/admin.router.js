const router = require("express").Router();
const { adminController } = require("../controllers");
const { authMiddleware } = require("../middlewares");

router.post("/auth/login", adminController.loginAdmin);
router.use(authMiddleware.authAdminMiddleware);
router.get("/salons", adminController.listSalons);
router.post("/salons", adminController.createSalon);
router.patch("/salons/:uuid/status", adminController.updateSalonStatus);
router.patch("/salons/:uuid/plan", adminController.updateSalonPlan);

module.exports = router;
