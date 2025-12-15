const router = require('express').Router();
const { serviceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createServiceSchema } = require('../schema/service/create-service.schema');
const { updateServiceSchema } = require('../schema/service/update-service.schema');
const { deleteServiceSchema } = require('../schema/service/delete-service.schema');
const { getServiceSchema } = require('../schema/service/get-service.schema');
const { listSubServicesSchema } = require('../schema/service/list-sub-services.schema');
const { listServiceStaffSchema } = require('../schema/service/list-staff.schema')
const { listServicesSchema } = require('../schema/service/list-services.schema');

router.get('/', validate(listServicesSchema), serviceController.listServices);
router.post('/', validate(createServiceSchema), serviceController.createService);
router.get('/:uuid/staffs', validate(listServiceStaffSchema), serviceController.listStaff);
router.get('/:uuid', validate(getServiceSchema), serviceController.getService);
router.get('/:uuid/sub-services', validate(listSubServicesSchema), serviceController.listSubServices);
router.put('/:uuid', validate(updateServiceSchema), serviceController.updateService);
router.delete('/:uuid', validate(deleteServiceSchema), serviceController.deleteService);

module.exports = router;