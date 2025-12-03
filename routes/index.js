const router = require('express').Router();

router.use('/salons', require('./salon.router'));
router.use('/salon-onboardings', require('./salon-onboarding.router'));
router.use('/auth', require('./auth.router'));

router.get('/', (req, res, next) => {
    res.send('Salon Management Service is running');
});

module.exports = router;