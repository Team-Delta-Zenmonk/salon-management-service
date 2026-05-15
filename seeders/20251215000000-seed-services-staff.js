"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = await import("uuid");

    if (process.env.NODE_ENV === "production") {
      console.log("Skipping seeder for production");
      return;
    }

    let salons = await queryInterface.sequelize.query(`SELECT id from salons LIMIT 1;`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    let salonId;

    if (salons.length > 0) {
      salonId = salons[0].id;
    } else {
      console.log("No salon found, creating one...");
      const uniqueSuffix = Date.now();
      const salonUuid = uuidv4();
      await queryInterface.bulkInsert("salons", [
        {
          uuid: salonUuid,
          name: "Seed Salon",
          email: `seed.salon.${uniqueSuffix}@example.com`,
          password: "hashedpassword",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const newSalons = await queryInterface.sequelize.query(`SELECT id from salons WHERE uuid = '${salonUuid}';`, {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      });
      salonId = newSalons[0].id;
    }

    let categories = await queryInterface.sequelize.query(
      `SELECT id from categories WHERE salon_id = ${salonId} LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    let categoryId;

    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      console.log("No category found, creating one...");
      const categoryUuid = uuidv4();
      await queryInterface.bulkInsert("categories", [
        {
          uuid: categoryUuid,
          name: "General Services",
          salon_id: salonId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const newCategories = await queryInterface.sequelize.query(
        `SELECT id from categories WHERE uuid = '${categoryUuid}';`,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
      );
      categoryId = newCategories[0].id;
    }

    console.log("Creating services...");
    const serviceUuids = [uuidv4(), uuidv4(), uuidv4()];
    const servicesData = [
      {
        uuid: serviceUuids[0],
        name: "Classic Haircut",
        description: "A classic haircut style.",
        price: 30,
        price_type: "fixed",
        gender: "male",
        salon_id: salonId,
        duration: 30,
        category_id: categoryId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        uuid: serviceUuids[1],
        name: "Blow Dry",
        description: "Wash and blow dry.",
        price: 45,
        price_type: "from",
        gender: "female",
        duration: 60,
        salon_id: salonId,
        category_id: categoryId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        uuid: serviceUuids[2],
        name: "Beard Trim",
        description: "Professional beard trimming.",
        price: 15,
        duration: 15,
        price_type: "fixed",
        gender: "male",
        salon_id: salonId,
        category_id: categoryId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("services", servicesData);

    console.log("Creating staff...");
    const staffUuids = [uuidv4(), uuidv4()];
    const staffData = [
      {
        uuid: staffUuids[0],
        first_name: "John",
        last_name: "Barber",
        email: `john.barber.${Date.now()}@example.com`,
        phone_number: "1234567890",
        dob: "1990-01-01",
        title: "Senior Barber",
        joining_date: "2022-01-01",
        address: JSON.stringify({
          street: "123 Main St",
          city: "Metropolis",
          state: "NY",
          zip: "10001",
        }),
        emergency_contact: JSON.stringify({
          name: "Jane Barber",
          phone: "0987654321",
          relation: "Spouse",
        }),
        gender: "male",
        salon_id: salonId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        uuid: staffUuids[1],
        first_name: "Sarah",
        last_name: "Stylist",
        email: `sarah.stylist.${Date.now()}@example.com`,
        phone_number: "9876543210",
        dob: "1992-05-15",
        title: "Senior Stylist",
        joining_date: "2023-03-01",
        address: JSON.stringify({
          street: "456 Elm St",
          city: "Gotham",
          state: "NJ",
          zip: "07001",
        }),
        emergency_contact: JSON.stringify({
          name: "Mike Stylist",
          phone: "1122334455",
          relation: "Brother",
        }),
        gender: "female",
        salon_id: salonId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("staffs", staffData);

    console.log("Linking staff and services...");

    const staffRecords = await queryInterface.sequelize.query(
      `SELECT id, uuid FROM staffs WHERE uuid IN ('${staffUuids.join("','")}')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const serviceRecords = await queryInterface.sequelize.query(
      `SELECT id, uuid FROM services WHERE uuid IN ('${serviceUuids.join("','")}')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const staffServiceData = [];

    for (const staff of staffRecords) {
      for (const service of serviceRecords) {
        staffServiceData.push({
          uuid: uuidv4(),
          staff_id: staff.id,
          service_id: service.id,
          duration: 45,
          price_type: "fixed",
          price: 30.0,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    if (staffServiceData.length > 0) {
      await queryInterface.bulkInsert("staff_services", staffServiceData);
    }
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkDelete("staff_services", null, {});
    await queryInterface.bulkDelete("services", null, {});
    await queryInterface.bulkDelete("staffs", null, {});
  },
};
