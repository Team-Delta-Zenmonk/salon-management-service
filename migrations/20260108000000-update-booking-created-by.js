"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // created_by enum type
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_booking_created_by" AS ENUM ('ADMIN', 'CUSTOMER');
        `);

        // allow null customer_id (for guest bookings)
        await queryInterface.changeColumn("bookings", "customer_id", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "customers",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });

        // admin_booking JSON field
        await queryInterface.addColumn("bookings", "admin_booking", {
            type: Sequelize.JSONB,
            allowNull: true,
        });

        // created_by column
        await queryInterface.addColumn("bookings", "created_by", {
            type: "enum_booking_created_by",
            allowNull: false,
            defaultValue: "CUSTOMER",
        });
    },

    async down(queryInterface, Sequelize) {
        // revert created_by column
        await queryInterface.removeColumn("bookings", "created_by");

        // revert admin_booking field
        await queryInterface.removeColumn("bookings", "admin_booking");

        // make customer_id required again
        await queryInterface.changeColumn("bookings", "customer_id", {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "customers",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });

        await queryInterface.sequelize.query(`
            DROP TYPE "enum_booking_created_by";
        `);
    },
};


