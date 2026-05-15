"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = await import("uuid");

    if (process.env.NODE_ENV === "production") {
      console.log("Skipping seeder for production");
      return;
    }

    const salons = await queryInterface.sequelize.query(`SELECT id FROM salons LIMIT 1;`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (salons.length === 0) {
      console.log("No salons found. Please run previous seeders first.");
      return;
    }
    const salonId = salons[0].id;

    const customers = await queryInterface.sequelize.query(`SELECT id FROM customers LIMIT 1;`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (customers.length === 0) {
      console.log("No customers found. Please run previous seeders first.");
      return;
    }
    const customerId = customers[0].id;

    const staffMembers = await queryInterface.sequelize.query(`SELECT id FROM staffs LIMIT 2;`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (staffMembers.length < 2) {
      console.log("Not enough staff found. Please run previous seeders first.");
      if (staffMembers.length === 0) return;
    }

    const services = await queryInterface.sequelize.query(`SELECT id, price FROM services LIMIT 2;`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (services.length < 2) {
      console.log("Not enough services found. Please run previous seeders first.");
      if (services.length === 0) return;
    }

    const cartUuid = uuidv4();
    const item1Price = services[0].price || 30;
    const item2Price = services[1] ? services[1].price || 45 : 0;

    const item1Duration = 30;
    const item2Duration = 45;

    const totalPrice = item1Price + item2Price;
    const totalDuration = item1Duration + item2Duration;

    console.log("Creating cart...");
    await queryInterface.bulkInsert("carts", [
      {
        uuid: cartUuid,
        customer_id: customerId,
        salon_id: salonId,
        total_price: totalPrice,
        total_duration: totalDuration,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const newCart = await queryInterface.sequelize.query(`SELECT id FROM carts WHERE uuid = '${cartUuid}';`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    const cartId = newCart[0].id;

    console.log("Creating cart items...");
    const cartItemsData = [];

    cartItemsData.push({
      uuid: uuidv4(),
      cart_id: cartId,
      staff_id: staffMembers[0].id,
      service_id: services[0].id,
      price: item1Price,
      duration: item1Duration,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (services.length > 1) {
      const staffId = staffMembers.length > 1 ? staffMembers[1].id : staffMembers[0].id;

      cartItemsData.push({
        uuid: uuidv4(),
        cart_id: cartId,
        staff_id: staffId,
        service_id: services[1].id,
        price: item2Price,
        duration: item2Duration,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert("cart_items", cartItemsData);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkDelete("cart_items", null, {});
    await queryInterface.bulkDelete("carts", null, {});
  },
};
