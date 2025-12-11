"use strict";
module.exports = {
    async up(queryInterface, Sequelize) {
        const { v4: uuidv4 } = await import('uuid');
        if (process.env.NODE_ENV !== "development") {
            console.log("Skipping seeder file for production ======>>>");
            return;
        }

        await queryInterface.bulkInsert(
            "customers",
            [
                {
                    uuid: uuidv4(),
                    name: "John Doe",
                    email: "john.doe@example.com",
                    gender: "male",
                    phone_number: "1234567890",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Jane Smith",
                    email: "jane.smith@example.com",
                    gender: "female",
                    phone_number: "9876543210",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Michael Johnson",
                    email: "michael.johnson@example.com",
                    gender: "male",
                    phone_number: "5557771234",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Emily Williams",
                    email: "emily.williams@example.com",
                    gender: "female",
                    phone_number: "4448882233",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Christopher Brown",
                    email: "christopher.brown@example.com",
                    gender: "male",
                    phone_number: "1122334455",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Olivia Davis",
                    email: "olivia.davis@example.com",
                    gender: "female",
                    phone_number: "6677889900",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Daniel Miller",
                    email: "daniel.miller@example.com",
                    gender: "male",
                    phone_number: "2233445566",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Sophia Moore",
                    email: "sophia.moore@example.com",
                    gender: "female",
                    phone_number: "5566778899",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Matthew Anderson",
                    email: "matthew.anderson@example.com",
                    gender: "male",
                    phone_number: "9988776655",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    uuid: uuidv4(),
                    name: "Ava Martinez",
                    email: "ava.martinez@example.com",
                    gender: "female",
                    phone_number: "3344556677",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        await queryInterface.bulkDelete("customers", null, {});
    },
};
