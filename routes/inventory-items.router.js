const { inventoryItemController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createInventoryItemSchema } = require('../schema/inventory-item/create-item.schema');
const { updateInventoryItemSchema } = require('../schema/inventory-item/update-item.schema');

const router = require('express').Router();

router.post('/', validate(createInventoryItemSchema), inventoryItemController.createInventoryItem);
router.get('/', inventoryItemController.listInventoryItems);
router.put('/:uuid', validate(updateInventoryItemSchema), inventoryItemController.updateInventoryItem);
router.get('/:uuid', inventoryItemController.getInventoryItem);

module.exports = router;
