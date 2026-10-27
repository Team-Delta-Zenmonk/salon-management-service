const { error } = require("../libs");
const { Op } = require("sequelize");
const { staffServiceRepository } = require("../repository");
const { DiscountType } = require("../models/service/service-types");
const {
  cartRepository,
  cartItemRepository,
  customerRepository,
  salonRepository,
  serviceRepository,
  staffRepository,
} = require("../repository");
const { assertStaffActive } = require("../utils/staff-status.util");
const { calculateFinalPrice } = require("../utils/pricing.util");

const updateCartTotals = async (cartId, transaction = null) => {
  const items = await cartItemRepository.findAll({ criteria: { cart_id: cartId }, transaction });

  let total_price = 0;
  let total_duration = 0;

  items.forEach((item) => {
    total_price += item.final_price;
    total_duration += item.duration;
  });

  await cartRepository.update({
    payload: { total_price, total_duration },
    criteria: { id: cartId },
    options: { transaction },
  });
};

exports.createCart = async (payload) => {
  const { body } = payload;
  const { salon_id, items, user_id } = body;

  const salon = await salonRepository.findOne({ uuid: salon_id });
  if (!salon) throw new error.NotFound("Salon not found");
  const user = await customerRepository.findOne({ uuid: user_id });
  if (!user) throw new error.NotFound("Customer not found");

  const transaction = await cartRepository.startTransaction();

  try {
    const cart = await cartRepository.create(
      {
        customer_id: user.id,
        salon_id: salon.id,
      },
      { transaction },
    );

    for (const itemData of items) {
      const service = await serviceRepository.findOne({ uuid: itemData.service_id });
      if (!service) throw new error.NotFound(`Service with UUID ${itemData.service_id} not found`);

      const childServices = await serviceRepository.findAll({ criteria: { parent_id: service.id } });
      if (childServices && childServices.length > 0) {
        throw new error.BadRequest(`Parent service '${service.name}' cannot be added directly. Please select a specific sub-service.`);
      }

      let staff = null;
      if (itemData.staff_id) {
        staff = await staffRepository.findOne({ uuid: itemData.staff_id });
        if (staff) assertStaffActive(staff, error);
      }

      const basePrice = itemData.base_price ?? service.price;

      const finalPrice = calculateFinalPrice({
        basePrice,
        discount: service.discount,
        discountType: service.discount_type,
      });

      await cartItemRepository.create(
        {
          cart_id: cart.id,
          service_id: service.id,
          staff_id: staff?.id ?? null,
          base_price: basePrice,
          final_price: finalPrice,
          duration: itemData.duration !== undefined ? itemData.duration : service.duration,
        },
        { transaction },
      );
    }

    await updateCartTotals(cart.id, transaction);

    await cartRepository.commitTransaction(transaction);

    return await cartRepository.getCartById(cart.id);
  } catch (err) {
    await cartRepository.rollbackTransaction(transaction);
    throw err;
  }
};

exports.addItem = async (payload) => {
  const { body } = payload;
  const { cart_id, service_id, staff_id, base_price } = body;

  const cart = await cartRepository.findOne({ uuid: cart_id });
  if (!cart) throw new error.NotFound("Cart not found");

  const existingItem = await cartItemRepository.findOne({
    cart_id: cart.id,
    service_id: (await serviceRepository.findOne({ uuid: service_id }))?.id,
  });

  if (existingItem) {
    throw new error.BadRequest("Service already exists in cart");
  }

  const service = await serviceRepository.findOne({ uuid: service_id });
  if (!service) throw new error.NotFound("Service not found");

  const childServices = await serviceRepository.findAll({ criteria: { parent_id: service.id } });
  if (childServices && childServices.length > 0) {
    throw new error.BadRequest(`Parent service '${service.name}' cannot be added directly. Please select a specific sub-service.`);
  }

  const basePrice = base_price ?? service.price;

  const finalPrice = calculateFinalPrice({
    basePrice,
    discount: service.discount,
    discountType: service.discount_type,
  });

  const item = await cartItemRepository.create({
    cart_id: cart.id,
    service_id: service.id,
    base_price: basePrice,
    final_price: finalPrice,
    duration: body.duration !== undefined ? body.duration : service.duration,
  });

  await updateCartTotals(cart.id);

  return item;
};

exports.updateItem = async (payload) => {
  const { body, params } = payload;
  const { uuid } = params;
  const { service_id, staff_id } = body;

  const item = await cartItemRepository.findOne({ uuid });
  if (!item) throw new error.NotFound("Cart Item not found");

  let updateData = {};

  if (service_id) {
    const service = await serviceRepository.findOne({ uuid: service_id });
    if (!service) throw new error.NotFound("Service not found");
    updateData.service_id = service.id;

    if (body.price === undefined) updateData.price = service.price;
    if (body.duration === undefined) updateData.duration = service.duration;
  }

  const targetServiceId = updateData.service_id || item.service_id;

  if (staff_id) {
    const staff = await staffRepository.findOne({ uuid: staff_id });
    if (!staff) throw new error.NotFound("Staff not found");

    assertStaffActive(staff, error);

    let staffService = await staffServiceRepository.findOne({
      staff_id: staff.id,
      service_id: targetServiceId,
    });

    if (!staffService) {
      const itemService = await serviceRepository.findOne({ id: targetServiceId });
      if (itemService && itemService.parent_id) {
        staffService = await staffServiceRepository.findOne({
          staff_id: staff.id,
          service_id: itemService.parent_id,
        });
      } else if (itemService && !itemService.parent_id) {
        const childServices = await serviceRepository.findAll({ criteria: { parent_id: itemService.id } });
        const childIds = childServices.map((cs) => cs.id);
        if (childIds.length > 0) {
          staffService = await staffServiceRepository.findOne({
            staff_id: staff.id,
            service_id: { [Op.in]: childIds },
          });
        }
      }
    }

    if (!staffService) throw new error.NotFound("This staff is not assigned to this service");

    updateData.staff_id = staff.id;
    updateData.final_price = staffService.price ? parseFloat(staffService.price) : item.base_price;
    updateData.duration = staffService.duration || item.duration;
  }
  if (body.price !== undefined) updateData.price = body.price;
  if (body.duration !== undefined) updateData.duration = body.duration;

  await cartItemRepository.update({
    payload: updateData,
    criteria: { id: item.id },
  });

  await updateCartTotals(item.cart_id);

  return await cartRepository.getCartById(item.cart_id);

};

exports.removeItem = async (payload) => {
  const { params } = payload;
  const { uuid } = params;

  const item = await cartItemRepository.findOne({ uuid });
  if (!item) throw new error.NotFound("Cart Item not found");

  await cartItemRepository.softDelete({ id: item.id });

  await updateCartTotals(item.cart_id);

  return { message: "Cart item removed successfully" };
};

exports.getCart = async (payload) => {
  const { params } = payload;
  const { uuid } = params;

  const cart = await cartRepository.findOne({ uuid }, ["cart_items"]);

  if (!cart) throw new error.NotFound("Cart not found");

  return cart;
};

exports.deleteCart = async (payload) => {
  const { params } = payload;
  const { uuid } = params;

  const cart = await cartRepository.findOne({ uuid });
  if (!cart) throw new error.NotFound("Cart not found");

  await cartItemRepository.softDelete({ cart_id: cart.id });
  await cartRepository.softDelete({ id: cart.id });

  return { message: "Cart deleted successfully" };
};
