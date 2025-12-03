const router = require('express').Router();
const { salonController } = require('../controllers');

router.put('/', salonController.updateSalon);

module.exports = router;