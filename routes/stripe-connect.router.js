const router = require('express').Router();
const { authMiddleware } = require('../middlewares');
const { stripeConnectController } = require('../controllers');

router.post('/onboard', authMiddleware.authSalonMiddleware, stripeConnectController.createOnboardingLink);
router.get('/dashboard', authMiddleware.authSalonMiddleware, stripeConnectController.createDashboardLoginLink);

module.exports = router;
