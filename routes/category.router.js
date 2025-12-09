const router = require('express').Router();
const { categoryController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createCategorySchema } = require('../schema/category/create-category.schema');
const { deleteCategorySchema } = require('../schema/category/delete-category.schema');
const { getCategorySchema } = require('../schema/category/get-category.schema');
const { updateCategorySchema } = require('../schema/category/update-category.schema');

router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.get('/', categoryController.listCategories);
router.put('/:uuid', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:uuid', validate(deleteCategorySchema), categoryController.deleteCategory);
router.get('/:uuid', validate(getCategorySchema), categoryController.getCategory);

module.exports = router;