"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("booking_services", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                unique: true,
            },
            booking_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "bookings",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            service_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "services",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            staff_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "staffs",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            sequence: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            offset_minutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            start_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            end_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            duration_minutes: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            price: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            deleted_at: {
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("booking_services");
    },
};
