"use strict";

const { PaymentStatus } = require("../models/payment/payment-types");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_payments_status" AS ENUM (
        '${PaymentStatus.ENUM.PENDING}',
        '${PaymentStatus.ENUM.SUCCEEDED}',
        '${PaymentStatus.ENUM.FAILED}'
      );
    `);

    await queryInterface.createTable("payments", {
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
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "inr",
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      stripe_client_secret: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: "enum_payments_status",
        allowNull: false,
        defaultValue: PaymentStatus.ENUM.PENDING,
      },
      attempt_no: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      idempotency_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      failure_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      captured_at: {
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

    await queryInterface.addIndex("payments", ["booking_id"], {
      name: "idx_payments_booking",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payments");

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_payments_status";
    `);
  },
};
