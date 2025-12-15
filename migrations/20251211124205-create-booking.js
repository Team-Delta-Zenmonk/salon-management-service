"use strict";

const { BookingType, BookingExecutionMode, BookingStatus } = require("../models/booking/booking-types");

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_booking_type" AS ENUM ('${BookingType.ENUM.SINGLE}', '${BookingType.ENUM.BOOKING}');
        `);

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_booking_execution_mode" AS ENUM ('${BookingExecutionMode.ENUM.SEQUENTIAL}', '${BookingExecutionMode.ENUM.PARALLEL}');
        `);

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_booking_status" AS ENUM ('${BookingStatus.ENUM.PENDING}', '${BookingStatus.ENUM.COMPLETED}', '${BookingStatus.ENUM.CANCELLED}');
        `);

        await queryInterface.createTable("bookings", {
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
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "customers",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            salon_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "salons",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            total_price: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            total_duration: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            booking_type: {
                type: "enum_booking_type",
                allowNull: false,
            },
            booking_execution_mode: {
                type: "enum_booking_execution_mode",
                allowNull: false,
            },
            status: {
                type: "enum_booking_status",
                allowNull: false,
            },
            booking_start_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            booking_end_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            booking_date: {
                type: Sequelize.DATE,
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
        await queryInterface.dropTable("bookings");

        await queryInterface.sequelize.query(`
            DROP TYPE "enum_booking_type";
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE "enum_booking_execution_mode";
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE "enum_booking_status";
        `);
    },
};
