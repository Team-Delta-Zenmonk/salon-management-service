const { error } = require("../libs");
const { customerRepository, cartRepository, salonRepository } = require("../repository");
const cartService = require("./cart.service");
const uploadService = require("./upload.service");

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

exports.updateCustomerProfile = async ({ customer, body }) => {
  if (!customer) {
    throw new error.Unauthorized("Customer authentication required");
  }

  const existingCustomer = await customerRepository.findOne({ id: customer.id });
  if (!existingCustomer) {
    throw new error.NotFound("Customer not found");
  }

  const updatePayload = {};
  if (body.name !== undefined) {
    updatePayload.name = body.name;
  }
  if (body.phone_number !== undefined) {
    updatePayload.phone_number = body.phone_number;
  }
  if (body.gender !== undefined) {
    updatePayload.gender = body.gender;
  }
  if (body.profile_image !== undefined) {
    updatePayload.profile_image = body.profile_image;
  }

  await customerRepository.update({
    payload: updatePayload,
    criteria: { id: customer.id },
  });

  const updatedCustomer = await customerRepository.findOne({ id: customer.id });

  return {
    message: "Customer profile updated successfully",
    customer: updatedCustomer,
  };
};

exports.generateCustomerPresignedUrl = async ({ customer, files }) => {
  if (!customer) {
    throw new error.Unauthorized("Customer authentication required");
  }

  const preparedFiles = files.map((file) => ({
    ...file,
    folder: file.folder || "customer-profiles",
  }));

  return await uploadService.generatePresignedUrls({ files: preparedFiles });
};
