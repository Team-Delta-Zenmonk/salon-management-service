const router = require('express').Router();
const { authMiddleware } = require('../middlewares');
const { salonController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { getSalonSchema } = require('../schema/salon/get-salon.schema');
const { listSalonsSchema } = require('../schema/salon/list-salons.schema');
const { updateSalonSchema } = require('../schema/salon/update-salon.schema');

router.get('/', validate(listSalonsSchema), salonController.listSalons);
router.get("/:uuid", validate(getSalonSchema), salonController.getSalon);
router.put('/', authMiddleware.authSalonMiddleware, validate(updateSalonSchema), salonController.updateSalon);

module.exports = router;