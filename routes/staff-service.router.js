const { staffServiceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createStaffServicesSchema } = require('../schema/staff-service/create-staff-service.schema');
const router = require('express').Router();

router.post('/', validate(createStaffServicesSchema), staffServiceController.bulkCreate);

module.exports = router;
