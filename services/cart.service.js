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
const { assertStaffActive, isStaffInactive } = require("../utils/staff-status.util");
const { calculateFinalPrice } = require("../utils/pricing.util");
const { assertServiceBookable, assertServicesBookable } = require("../utils/service-validation.util");

const syncCartState = async (cart, transaction = null) => {
  if (!cart) return null;

  const cartItems = await cartItemRepository.findAll({
    criteria: { cart_id: cart.id, deleted_at: null },
    transaction,
  });

  if (!cartItems || cartItems.length === 0) {
    if (cart.total_price !== 0 || cart.total_duration !== 0) {
      await cartRepository.update({
        payload: { total_price: 0, total_duration: 0 },
        criteria: { id: cart.id },
        options: { transaction },
      });
    }
    return;
  }

  const serviceIds = cartItems.map((item) => item.service_id);
  const services = await serviceRepository.findAll({
    criteria: { id: { [Op.in]: serviceIds } },
    transaction,
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const staffIds = cartItems.map((item) => item.staff_id).filter(Boolean);
  const staffMembers = staffIds.length > 0
    ? await staffRepository.findAll({
        criteria: { id: { [Op.in]: staffIds } },
        transaction,
      })
    : [];
  const staffMap = new Map(staffMembers.map((st) => [st.id, st]));

  const staffServices = staffIds.length > 0
    ? await staffServiceRepository.findAll({
        criteria: {
          staff_id: { [Op.in]: staffIds },
          deleted_at: null,
        },
        transaction,
      })
    : [];

  let newTotalPrice = 0;
  let newTotalDuration = 0;

  for (const item of cartItems) {
    const service = serviceMap.get(item.service_id);

    if (!service || service.deleted_at || !service.is_active) {
      await cartItemRepository.softDelete({ id: item.id }, { transaction });
      continue;
    }

    let staffId = item.staff_id;
    let basePrice = service.price;
    let duration = service.duration;
    let finalPrice = calculateFinalPrice({
      basePrice,
      discount: service.discount,
      discountType: service.discount_type,
    });

    if (staffId) {
      const staff = staffMap.get(staffId);
      const isInactive = !staff || staff.deleted_at || isStaffInactive(staff);

      if (isInactive) {
        staffId = null;
      } else {
        const staffService = staffServices.find(
          (ss) => ss.staff_id === staffId && (ss.service_id === service.id || (service.parent_id && ss.service_id === service.parent_id))
        );

        if (!staffService) {
          staffId = null;
        } else {
          duration = staffService.duration || service.duration;
          if (staffService.price) {
            finalPrice = parseFloat(staffService.price);
          }
        }
      }
    }

    const updates = {};
    if (item.staff_id !== staffId) updates.staff_id = staffId;
    if (item.base_price !== basePrice) updates.base_price = basePrice;
    if (item.final_price !== finalPrice) updates.final_price = finalPrice;
    if (item.duration !== duration) updates.duration = duration;

    if (Object.keys(updates).length > 0) {
      await cartItemRepository.update({
        payload: updates,
        criteria: { id: item.id },
        options: { transaction },
      });
    }

    newTotalPrice += finalPrice;
    newTotalDuration += duration;
  }

  if (cart.total_price !== newTotalPrice || cart.total_duration !== newTotalDuration) {
    await cartRepository.update({
      payload: { total_price: newTotalPrice, total_duration: newTotalDuration },
      criteria: { id: cart.id },
      options: { transaction },
    });
  }
};

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
    const serviceUuids = items.map((i) => i.service_id);
    const services = await serviceRepository.findAll({
      criteria: { uuid: { [Op.in]: serviceUuids } },
    });

    const serviceByUuid = new Map(services.map((s) => [s.uuid, s]));

    for (const itemData of items) {
      if (!serviceByUuid.has(itemData.service_id)) {
        throw new error.NotFound(`Service with UUID ${itemData.service_id} not found`);
      }
    }

    await assertServicesBookable(services, "added");

    const staffUuids = [...new Set(items.map((i) => i.staff_id).filter(Boolean))];
    const staffMembers = staffUuids.length > 0
      ? await staffRepository.findAll({ criteria: { uuid: { [Op.in]: staffUuids } } })
      : [];

    const staffByUuid = new Map(staffMembers.map((st) => [st.uuid, st]));

    const staffIds = staffMembers.map((st) => st.id);
    const staffServices = staffIds.length > 0
      ? await staffServiceRepository.findAll({
          criteria: {
            staff_id: { [Op.in]: staffIds },
            deleted_at: null,
          },
        })
      : [];

    const cart = await cartRepository.create(
      {
        customer_id: user.id,
        salon_id: salon.id,
      },
      { transaction },
    );

    const cartItemsPayload = items.map((itemData) => {
      const service = serviceByUuid.get(itemData.service_id);
      let staff = itemData.staff_id ? staffByUuid.get(itemData.staff_id) : null;

      if (staff && isStaffInactive(staff)) {
        staff = null;
      }

      let basePrice = service.price;
      let duration = service.duration;
      let finalPrice = calculateFinalPrice({
        basePrice,
        discount: service.discount,
        discountType: service.discount_type,
      });

      if (staff) {
        const staffService = staffServices.find(
          (ss) => ss.staff_id === staff.id && (ss.service_id === service.id || (service.parent_id && ss.service_id === service.parent_id))
        );

        if (!staffService) {
          staff = null;
        } else {
          duration = staffService.duration || service.duration;
          if (staffService.price) {
            finalPrice = parseFloat(staffService.price);
          }
        }
      }

      return {
        cart_id: cart.id,
        service_id: service.id,
        staff_id: staff?.id ?? null,
        base_price: basePrice,
        final_price: finalPrice,
        duration: duration,
      };
    });

    await cartItemRepository.createBulk(cartItemsPayload, { transaction });

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

  await assertServiceBookable(service, "added");

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

exports.syncCartState = syncCartState;

exports.getCart = async (payload) => {
  const { params } = payload;
  const { uuid } = params;

  const cart = await cartRepository.findOne({ uuid });

  if (!cart) throw new error.NotFound("Cart not found");

  await syncCartState(cart);

  return await cartRepository.getCartById(cart.id);
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
