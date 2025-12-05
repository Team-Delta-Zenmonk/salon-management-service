const { authMiddleware } = require('../middlewares');

const router = require('express').Router();

router.use('/auth', require('./auth.router'));
router.use('/salon-onboardings', require('./salon-onboarding.router'));
router.use('/salons', authMiddleware.authSalonMiddleware, require('./salon.router'));
router.use('/salons/categories', authMiddleware.authSalonMiddleware, require('./category.router'));
router.use('/salons/services', authMiddleware.authSalonMiddleware, require('./service.router'));

router.get('/', (req, res, next) => {
    res.send('Salon Management Service is running');
});

module.exports = router;