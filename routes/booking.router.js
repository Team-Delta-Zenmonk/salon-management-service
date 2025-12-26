const router = require('express').Router();
const { bookingController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createBookingSchema } = require('../schema/booking/create-booking.schema');

router.post('/', validate(createBookingSchema), bookingController.createBooking);

module.exports = router;