"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("theme_invoices", {
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
      theme_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "storefront_themes",
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
        defaultValue: "pending",
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "card",
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
      stripe_client_secret: {
        type: Sequelize.STRING,
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
        allowNull: true,
      },
    });

    await queryInterface
      .addIndex("theme_invoices", ["salon_id", "theme_id"], {
        unique: true,
        name: "theme_invoices_salon_theme_unique",
      })
      .catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("theme_invoices");
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_theme_invoices_status" CASCADE;')
      .catch(() => {});
  },
};

