const router = require('express').Router();
const { authMiddleware } = require('../middlewares');
const { serviceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createServiceSchema } = require('../schema/service/create-service.schema');
const { updateServiceSchema } = require('../schema/service/update-service.schema');
const { deleteServiceSchema } = require('../schema/service/delete-service.schema');
const { getServiceSchema } = require('../schema/service/get-service.schema');
const { listSubServicesSchema } = require('../schema/service/list-sub-services.schema');
const { listServiceStaffSchema } = require('../schema/service/list-staff.schema')
const { listServicesSchema } = require('../schema/service/list-services.schema');

router.get('/', authMiddleware.authSalonMiddleware, validate(listServicesSchema), serviceController.listServices);
router.post('/', authMiddleware.authSalonMiddleware, validate(createServiceSchema), serviceController.createService);
router.get('/:uuid/staffs', validate(listServiceStaffSchema), serviceController.listStaff);
router.get('/:uuid', authMiddleware.authSalonMiddleware, validate(getServiceSchema), serviceController.getService);
router.get('/:uuid/sub-services', authMiddleware.authSalonMiddleware, validate(listSubServicesSchema), serviceController.listSubServices);
router.put('/:uuid', authMiddleware.authSalonMiddleware, validate(updateServiceSchema), serviceController.updateService);
router.delete('/:uuid', authMiddleware.authSalonMiddleware, validate(deleteServiceSchema), serviceController.deleteService);

module.exports = router;