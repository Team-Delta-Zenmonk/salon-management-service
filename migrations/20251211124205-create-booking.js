"use strict";

const { BookingType, BookingExecutionMode, BookingStatus, BookingSource } = require("../models/booking/booking-types");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_booking_type" AS ENUM (
        '${BookingType.ENUM.SINGLE}',
        '${BookingType.ENUM.BOOKING}'
      );
     `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_booking_execution_mode" AS ENUM (
        '${BookingExecutionMode.ENUM.SEQUENTIAL}',
        '${BookingExecutionMode.ENUM.PARALLEL}'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_booking_status" AS ENUM (
        '${BookingStatus.ENUM.PENDING}',
        '${BookingStatus.ENUM.CONFIRMED}',
        '${BookingStatus.ENUM.COMPLETED}',
        '${BookingStatus.ENUM.CANCELLED}',
        '${BookingStatus.ENUM.EXPIRED}'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_booking_source" AS ENUM (
        '${BookingSource.ENUM.CUSTOMER}',
        '${BookingSource.ENUM.ADMIN}'
      );
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
        allowNull: true,
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
      admin_booking: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_by: {
        type: "enum_booking_source",
        allowNull: false,
      },
      cart_snapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
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
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("bookings", ["customer_id"], {
      name: "idx_bookings_customer",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bookings");

    await queryInterface.sequelize.query(`
      DROP TYPE "enum_booking_source";
    `);

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
