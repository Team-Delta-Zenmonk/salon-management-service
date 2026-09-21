"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("subscription_invoices", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
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
      invoice_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      plan: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_cycle: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "monthly",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "INR",
      },
      status: {
        type: Sequelize.ENUM("paid", "pending", "failed"),
        allowNull: false,
        defaultValue: "paid",
      },
      discount_details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
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
        unique: true,
      },
      billing_period_start: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      billing_period_end: {
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
        allowNull: true,
      },
    });

    await queryInterface
      .addIndex("subscription_invoices", ["salon_id"], {
        name: "subscription_invoices_salon_id_idx",
      })
      .catch(() => {});

    await queryInterface
      .addIndex("subscription_invoices", ["invoice_number"], {
        unique: true,
        name: "subscription_invoices_invoice_number_unique",
      })
      .catch(() => {});

    await queryInterface
      .addIndex("subscription_invoices", ["stripe_payment_intent_id"], {
        unique: true,
        name: "subscription_invoices_stripe_payment_intent_id_unique",
      })
      .catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("subscription_invoices");
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_subscription_invoices_status" CASCADE;')
      .catch(() => {});
  },
};
