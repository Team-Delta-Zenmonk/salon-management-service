"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoices", {
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
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      invoice_type: {
        type: Sequelize.ENUM("BOOKING", "SUBSCRIPTION", "THEME"),
        allowNull: false,
        defaultValue: "BOOKING",
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "bookings",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
      theme_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      grand_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      balance_due: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "INR",
      },
      payment_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "PENDING",
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      payment_details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stripe_client_secret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      invoice_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("invoices");
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_invoices_invoice_type" CASCADE;')
      .catch(() => {});
  },
};
