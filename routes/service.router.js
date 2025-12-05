const router = require('express').Router();
const { serviceController } = require('../controllers');

router.post('/', serviceController.createService);
router.get('/:uuid', serviceController.getService);
router.get('/:uuid/sub-services', serviceController.listSubServices);
router.get('/category/:uuid', serviceController.listServicesByCategory);
router.put('/:uuid', serviceController.updateService);
router.delete('/:uuid', serviceController.deleteService);

module.exports = router;