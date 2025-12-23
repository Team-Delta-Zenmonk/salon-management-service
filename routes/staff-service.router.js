const { staffServiceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createStaffServicesSchema } = require('../schema/staff-service/create-staff-service.schema');
const { unassignStaffServiceSchema } = require('../schema/staff-service/unassign-staff-service.schema');
const router = require('express').Router();

router.post('/', validate(createStaffServicesSchema), staffServiceController.bulkCreate);
router.delete('/:staff_uuid/:service_uuid', validate(unassignStaffServiceSchema), staffServiceController.unassignStaffService);

module.exports = router;
