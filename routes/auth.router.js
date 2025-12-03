const router = require('express').Router();
const { authController } = require('../controllers');

router.post('/login/salon', authController.loginSalon);

module.exports = router;