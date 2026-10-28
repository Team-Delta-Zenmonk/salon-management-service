const { error } = require("../libs");
const { customerRepository, cartRepository } = require("../repository");
const cartService = require("./cart.service");

exports.getCustomerCart = async ({ customerUuid }) => {
  const customer = await customerRepository.findOne({ uuid: customerUuid });
  if (!customer) {
    throw new error.NotFound("Customer not found");
  }

  const cart = await cartRepository.findOne({ customer_id: customer.id, deleted_at: null });
  if (!cart) return null;

  await cartService.syncCartState(cart);

  return await cartRepository.getCartById(cart.id);
};
