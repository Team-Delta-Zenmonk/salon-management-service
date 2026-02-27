const router = require('express').Router();
const { salonController, customerController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { getAvailableSlotsSchema } = require('../schema/customer/get-available-slots.schema');
const {getCustomerCartSchema} = require('../schema/customer/get-customer-cart.schema');

router.get('/available-slots', validate(getAvailableSlotsSchema), salonController.getAvailableSlots);
router.get('/:uuid/cart', validate(getCustomerCartSchema),customerController.getCustomerCart);

module.exports = router;