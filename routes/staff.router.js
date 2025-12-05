const { staffController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createStaffSchema } = require('../schema/staff/create-staff-schema');
const { getStaffSchema } = require('../schema/staff/get-staff-schema');
const { removeStaffSchema } = require('../schema/staff/remove-staff-schema');
const { updateStaffSchema } = require('../schema/staff/update-staff-schema');
const router = require('express').Router();

router.post('/', validate(createStaffSchema), staffController.create);
router.put('/:uuid', validate(updateStaffSchema), staffController.update);
router.get('/', staffController.list);
router.get('/:uuid', validate(getStaffSchema), staffController.get);
router.delete('/:uuid', validate(removeStaffSchema), staffController.remove);

module.exports = router;
