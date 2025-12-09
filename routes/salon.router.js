const router = require('express').Router();
const { salonController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { updateSalonSchema } = require('../schema/salon/update-salon.schema');

router.put('/', validate(updateSalonSchema), salonController.updateSalon);

module.exports = router;