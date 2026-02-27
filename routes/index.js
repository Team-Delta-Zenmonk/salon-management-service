const { authMiddleware } = require('../middlewares');

const router = require('express').Router();

router.use('/auth', require('./auth.router'));
router.use('/salon-onboardings', require('./salon-onboarding.router'));
router.use('/salons/services', require('./service.router'));
router.use('/salons/categories', authMiddleware.authSalonMiddleware, require('./category.router'));
router.use('/salons/staffs', require('./staff.router'));
router.use('/salons/staff-services', authMiddleware.authSalonMiddleware, require('./staff-service.router'));
router.use('/salons/holidays', authMiddleware.authSalonMiddleware, require('./holiday.router'));
router.use('/salons/upload-images', require('./upload.router'));
router.use('/salons', require('./salon.router'));
router.use('/cart', authMiddleware.authCustomerMiddleware, require('./cart.router'));
router.use('/customers', require('./customer.router'));
router.use('/bookings', require('./booking.router'));

router.get('/', (req, res, next) => {
    res.send('Salon Management Service is running');
});

module.exports = router;