const { error } = require("../libs");
const { customerRepository, cartRepository, salonRepository } = require("../repository");
const cartService = require("./cart.service");

exports.getCustomerCart = async ({ customerUuid, query = {} }) => {
  const customer = await customerRepository.findOne({ uuid: customerUuid });
  if (!customer) {
    throw new error.NotFound("Customer not found");
  }

  const cartCriteria = { customer_id: customer.id, deleted_at: null };

  const { salon_id } = query;
  if (salon_id) {
    const isNumeric = !isNaN(salon_id) && Number.isInteger(Number(salon_id));
    const isUuid =
      typeof salon_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(salon_id);

    let salon = null;
    if (isNumeric) {
      salon = await salonRepository.findOne({ id: Number(salon_id) });
    } else if (isUuid) {
      salon = await salonRepository.findOne({ uuid: salon_id });
    } else {
      salon = await salonRepository.findOne({ slug: salon_id });
    }

    if (salon) {
      cartCriteria.salon_id = salon.id;
    } else {
      return null;
    }
  }

  const cart = await cartRepository.findOne(cartCriteria);
  if (!cart) return null;

  await cartService.syncCartState(cart);

  return await cartRepository.getCartById(cart.id);
};
