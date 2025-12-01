const router = require('express').Router();
const { salonController } = require('../controllers');

router.get('/hello-salon-1', salonController.helloSalon1);
router.get('/hello-salon-2', salonController.helloSalon2);

module.exports = router;