const router = require('express').Router();
const { categoryController } = require('../controllers');

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.put('/:uuid', categoryController.updateCategory);
router.delete('/:uuid', categoryController.deleteCategory);


module.exports = router;