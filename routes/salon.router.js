const router = require('express').Router();
const { salonController } = require('../controllers');

router.post('/onboard', salonController.onBoardSalon);

module.exports = router;