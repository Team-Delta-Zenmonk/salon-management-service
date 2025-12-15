const router = require('express').Router();
const { cartController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { createCartSchema } = require('../schema/cart/create-cart.schema');
const { getCartSchema } = require('../schema/cart/get-cart.schema');
const { deleteCartSchema } = require('../schema/cart/delete-cart.schema');
const { addItemSchema } = require('../schema/cart/add-item.schema');
const { updateCartItemSchema } = require('../schema/cart-item/update-cart-item.schema');
const { deleteCartItemSchema } = require('../schema/cart-item/delete-cart-item.schema');

router.post('/', validate(createCartSchema), cartController.createCart);
router.get('/:uuid', validate(getCartSchema), cartController.getCart);
router.delete('/:uuid', validate(deleteCartSchema), cartController.deleteCart);
router.post('/item', validate(addItemSchema), cartController.addItem);
router.put('/item/:uuid', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/item/:uuid', validate(deleteCartItemSchema), cartController.removeItem);

module.exports = router;
