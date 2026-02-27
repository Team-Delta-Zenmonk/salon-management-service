const { error } = require("../libs");
const { customerRepository, cartRepository } = require("../repository");

exports.getCustomerCart = async ({ customerUuid }) => {
  const customer = await customerRepository.findOne({ uuid: customerUuid });
  if (!customer) {
    throw new error.NotFound("Customer not found");
  }

  return await cartRepository.getActiveCartByCustomerId(customer.id);
};
