const router = require('express').Router();
const salonController = require('../controllers/salon-onboarding.controller');
const { validate } = require('../middlewares/validate.middleware');
const { initOnboardingSchema } = require('../schema/salon-onboarding/init-onboarding.schema');
const { verifyOnboardingSchema } = require('../schema/salon-onboarding/verify-onboarding.schema');
const { resendOtpSchema } = require('../schema/salon-onboarding/resend-otp.schema');

router.post('/init',validate(initOnboardingSchema), salonController.initOnboarding);
router.post('/verify',validate(verifyOnboardingSchema), salonController.verifyOnboarding);
router.post('/resend-otp',validate(resendOtpSchema), salonController.resendOtp);

module.exports = router;
