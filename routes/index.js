const { authMiddleware } = require('../middlewares');

const router = require('express').Router();

router.use('/auth', require('./auth.router'));
router.use('/salon-onboardings', require('./salon-onboarding.router'));
router.use('/salons', authMiddleware.authSalonMiddleware, require('./salon.router'));
router.use('/salons/categories', authMiddleware.authSalonMiddleware, require('./category.router'));
router.use('/salons/services', authMiddleware.authSalonMiddleware, require('./service.router'));
router.use('/salons/staffs', authMiddleware.authSalonMiddleware, require('./staff.router'));
router.use('/salons/staff-services', authMiddleware.authSalonMiddleware, require('./staff-service.router'));
router.use('/salons/holidays', authMiddleware.authSalonMiddleware, require('./holiday.router'));
router.use('/salons/upload-images', require('./upload.router'));
router.use('/cart', authMiddleware.authCustomerMiddleware, require('./cart.router'));

router.get('/', (req, res, next) => {
    res.send('Salon Management Service is running');
});

module.exports = router;