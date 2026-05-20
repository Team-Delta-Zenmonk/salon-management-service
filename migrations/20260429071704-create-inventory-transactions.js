"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
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
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "inventory_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ordered_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      received_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      damaged_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      returned_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      bill_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      ordered_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      received_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("inventory_transactions");
  },
};
