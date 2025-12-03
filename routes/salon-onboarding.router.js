const router = require('express').Router();
const salonController = require('../controllers/salon-onboarding.controller');

router.post('/init', salonController.init);
router.post('/verify', salonController.verify);
router.post('/resend-otp', salonController.resend);

module.exports = router;
