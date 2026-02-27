const { staffController } = require("../controllers");
const { authMiddleware } = require('../middlewares');
const { validate } = require("../middlewares/validate.middleware");
const { createStaffSchema } = require("../schema/staff/create-staff.schema");
const { getStaffSchema } = require("../schema/staff/get-staff.schema");
const { listStaffServicesSchema } = require("../schema/staff/list-staff-services.schema");
const { removeStaffSchema } = require("../schema/staff/remove-staff.schema");
const { updateStaffSchema } = require("../schema/staff/update-staff.schema");
const router = require("express").Router();

router.post("/",  authMiddleware.authSalonMiddleware, validate(createStaffSchema), staffController.create);
router.put("/:uuid", authMiddleware.authSalonMiddleware, validate(updateStaffSchema), staffController.update);
router.get("/", authMiddleware.authSalonMiddleware,  staffController.list);
router.get('/:uuid/services', authMiddleware.authSalonMiddleware, validate(listStaffServicesSchema), staffController.listServices);
router.get("/:uuid", validate(getStaffSchema), staffController.get);
router.delete("/:uuid", authMiddleware.authSalonMiddleware, validate(removeStaffSchema), staffController.remove);

module.exports = router;
