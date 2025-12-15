const { error } = require("../libs");
const {
    cartRepository,
    cartItemRepository,
    salonRepository,
    serviceRepository,
    staffRepository
} = require("../repository");

const updateCartTotals = async (cartId, transaction = null) => {
    const items = await cartItemRepository.findAll({ criteria: { cart_id: cartId }, transaction });

    let total_price = 0;
    let total_duration = 0;

    items.forEach(item => {
        total_price += item.price;
        total_duration += item.duration;
    });

    await cartRepository.update({
        payload: { total_price, total_duration },
        criteria: { id: cartId },
        options: { transaction }
    });
};

exports.createCart = async (payload) => {
    const { body, user } = payload;
    const { salon_id, items } = body;

    const salon = await salonRepository.findOne({ uuid: salon_id });
    if (!salon) throw new error.NotFound("Salon not found");

    const transaction = await cartRepository.startTransaction();

    try {
        const cart = await cartRepository.create({
            customer_id: user.id,
            salon_id: salon.id,
        }, { transaction });

        for (const itemData of items) {
            const service = await serviceRepository.findOne({ uuid: itemData.service_id });
            if (!service) throw new error.NotFound(`Service with UUID ${itemData.service_id} not found`);

            const staff = await staffRepository.findOne({ uuid: itemData.staff_id });
            if (!staff) throw new error.NotFound(`Staff with UUID ${itemData.staff_id} not found`);

            await cartItemRepository.create({
                cart_id: cart.id,
                service_id: service.id,
                staff_id: staff.id,
                price: service.price,
                duration: service.duration
            }, { transaction });
        }

        await updateCartTotals(cart.id, transaction);

        await cartRepository.commitTransaction(transaction);

        return await cartRepository.findOne({ criteria: { id: cart.id }, include: ['cart_items'] });

    } catch (err) {
        await cartRepository.rollbackTransaction(transaction);
        throw err;
    }
};

exports.addItem = async (payload) => {
    const { body } = payload;
    const { cart_id, service_id, staff_id } = body;

    const cart = await cartRepository.findOne({ uuid: cart_id });
    if (!cart) throw new error.NotFound("Cart not found");

    const service = await serviceRepository.findOne({ uuid: service_id });
    if (!service) throw new error.NotFound("Service not found");

    const staff = await staffRepository.findOne({ uuid: staff_id });
    if (!staff) throw new error.NotFound("Staff not found");

    const item = await cartItemRepository.create({
        cart_id: cart.id,
        service_id: service.id,
        staff_id: staff.id,
        price: service.price,
        duration: service.duration
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
        updateData.price = service.price;
        updateData.duration = service.duration;
    }

    if (staff_id) {
        const staff = await staffRepository.findOne({ uuid: staff_id });
        if (!staff) throw new error.NotFound("Staff not found");
        updateData.staff_id = staff.id;
    }

    await cartItemRepository.update({
        payload: updateData,
        criteria: { id: item.id }
    });

    await updateCartTotals(item.cart_id);

    return { message: "Cart item updated successfully" };
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

    const cart = await cartRepository.findOne(
        { uuid },
        ['cart_items']
    );

    if (!cart) throw new error.NotFound("Cart not found");

    return cart;
};

exports.deleteCart = async (payload) => {
    const { params } = payload;
    const { uuid } = params;

    const cart = await cartRepository.findOne({ uuid });
    if (!cart) throw new error.NotFound("Cart not found");

    await cartRepository.softDelete({ id: cart.id });

    return { message: "Cart deleted successfully" };
}
