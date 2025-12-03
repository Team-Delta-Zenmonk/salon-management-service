const router = require('express').Router();
const { authController } = require('../controllers');

router.post('/login/salon', authController.loginSalon);
router.post('/forgot-password/salon', authController.forgotPassword);
router.post('/reset-password/salon', authController.resetPassword);

module.exports = router;