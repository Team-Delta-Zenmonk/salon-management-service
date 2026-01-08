const { staffServiceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createStaffServicesSchema } = require('../schema/staff-service/create-staff-service.schema');
const { bulkUnassignStaffServiceSchema } = require('../schema/staff-service/bulk-unassign-staff-service.schema');
const router = require('express').Router();

router.post('/', validate(createStaffServicesSchema), staffServiceController.bulkCreate);
router.post('/unassign', validate(bulkUnassignStaffServiceSchema), staffServiceController.bulkUnassignStaffService);

module.exports = router;
