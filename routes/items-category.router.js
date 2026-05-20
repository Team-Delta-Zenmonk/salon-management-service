const { itemsCategoryController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createItemsCategorySchema } = require('../schema/items-category/create-category.schema');
const router = require('express').Router();

router.post('/', validate(createItemsCategorySchema), itemsCategoryController.createCategory);
router.get('/', itemsCategoryController.listCategories);

module.exports = router;
