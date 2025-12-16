const router = require('express').Router();
const { salonController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { listSalonsSchema } = require('../schema/salon/list-salons.schema');
const { updateSalonSchema } = require('../schema/salon/update-salon.schema');

router.put('/', validate(updateSalonSchema), salonController.updateSalon);
router.get('/', validate(listSalonsSchema), salonController.listSalons);

module.exports = router;