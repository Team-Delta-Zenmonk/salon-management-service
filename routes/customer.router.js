const router = require('express').Router();
const { salonController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { getAvailableSlotsSchema } = require('../schema/customer/get-available-slots.schema');

router.get('/available-slots', validate(getAvailableSlotsSchema), salonController.getAvailableSlots);

module.exports = router;