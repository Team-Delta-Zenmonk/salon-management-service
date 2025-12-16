"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        const { v4: uuidv4 } = await import('uuid');

        if (process.env.NODE_ENV === "production") {
            console.log("Skipping seeder for production");
            return;
        }

        // 1. Get or Create Salon
        let salons = await queryInterface.sequelize.query(
            `SELECT id from salons LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        let salonId;

        if (salons.length > 0) {
            salonId = salons[0].id;
        } else {
            console.log("No salon found, creating one...");
            // Ensure we have a unique email if we repeatedly run this in dev without cleaning
            const uniqueSuffix = Date.now();
            const salonUuid = uuidv4();
            await queryInterface.bulkInsert('salons', [{
                uuid: salonUuid,
                name: "Seed Salon",
                email: `seed.salon.${uniqueSuffix}@example.com`,
                password: "hashedpassword", // In a real app, use a hashed equivalent of 'password'
                created_at: new Date(),
                updated_at: new Date()
            }]);

            const newSalons = await queryInterface.sequelize.query(
                `SELECT id from salons WHERE uuid = '${salonUuid}';`,
                { type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            salonId = newSalons[0].id;
        }

        // 2. Get or Create Category
        let categories = await queryInterface.sequelize.query(
            `SELECT id from categories WHERE salon_id = ${salonId} LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        let categoryId;

        if (categories.length > 0) {
            categoryId = categories[0].id;
        } else {
            console.log("No category found, creating one...");
            const categoryUuid = uuidv4();
            await queryInterface.bulkInsert('categories', [{
                uuid: categoryUuid,
                name: "General Services",
                salon_id: salonId,
                created_at: new Date(),
                updated_at: new Date()
            }]);

            const newCategories = await queryInterface.sequelize.query(
                `SELECT id from categories WHERE uuid = '${categoryUuid}';`,
                { type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            categoryId = newCategories[0].id;
        }

        // 3. Create Services
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
                category_id: categoryId,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                uuid: serviceUuids[1],
                name: "Blow Dry",
                description: "Wash and blow dry.",
                price: 45,
                price_type: "from",
                gender: "female",
                salon_id: salonId,
                category_id: categoryId,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                uuid: serviceUuids[2],
                name: "Beard Trim",
                description: "Professional beard trimming.",
                price: 15,
                price_type: "fixed",
                gender: "male",
                salon_id: salonId,
                category_id: categoryId,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        await queryInterface.bulkInsert('services', servicesData);

        // 4. Create Staff
        console.log("Creating staff...");
        const staffUuids = [uuidv4(), uuidv4()];
        const staffData = [
            {
                uuid: staffUuids[0],
                first_name: "John",
                last_name: "Barber",
                email: `john.barber.${Date.now()}@example.com`,
                phone_number: "1234567890",
                country: "US",
                dob: "1990-01-01",
                title: "Senior Barber",
                joining_date: "2022-01-01",
                address: JSON.stringify({
                    street: "123 Main St",
                    city: "Metropolis",
                    state: "NY",
                    zip: "10001"
                }),
                emergency_contact: JSON.stringify({
                    name: "Jane Barber",
                    phone: "0987654321",
                    relation: "Spouse"
                }),
                gender: "male",
                salon_id: salonId,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                uuid: staffUuids[1],
                first_name: "Sarah",
                last_name: "Stylist",
                email: `sarah.stylist.${Date.now()}@example.com`,
                phone_number: "9876543210",
                country: "US",
                dob: "1992-05-15",
                title: "Senior Stylist",
                joining_date: "2023-03-01",
                address: JSON.stringify({
                    street: "456 Elm St",
                    city: "Gotham",
                    state: "NJ",
                    zip: "07001"
                }),
                emergency_contact: JSON.stringify({
                    name: "Mike Stylist",
                    phone: "1122334455",
                    relation: "Brother"
                }),
                gender: "female",
                salon_id: salonId,
                created_at: new Date(),
                updated_at: new Date()
            },
        ];

        await queryInterface.bulkInsert('staffs', staffData);

        // 5. Create StaffService Relations
        console.log("Linking staff and services...");

        // Fetch IDs for the inserted services and staff
        const staffRecords = await queryInterface.sequelize.query(
            `SELECT id, uuid FROM staffs WHERE uuid IN ('${staffUuids.join("','")}')`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const serviceRecords = await queryInterface.sequelize.query(
            `SELECT id, uuid FROM services WHERE uuid IN ('${serviceUuids.join("','")}')`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const staffServiceData = [];

        // Assign all services to all staff for simplicity, or mix and match
        for (const staff of staffRecords) {
            for (const service of serviceRecords) {
                staffServiceData.push({
                    uuid: uuidv4(),
                    staff_id: staff.id,
                    service_id: service.id,
                    duration: 45, // Default duration
                    price_type: "fixed",
                    price: 30.00,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
        }

        if (staffServiceData.length > 0) {
            await queryInterface.bulkInsert('staff_services', staffServiceData);
        }
    },

    async down(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === "production") return;

        await queryInterface.bulkDelete('staff_services', null, {});
        await queryInterface.bulkDelete('services', null, {});
        await queryInterface.bulkDelete('staffs', null, {});
    }
};
