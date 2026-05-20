"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InventoryTransaction extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });
      this.belongsTo(models.InventoryItem, {
        foreignKey: "item_id",
        as: "item",
      });
    }
  }
  InventoryTransaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      salon_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "salons",
          key: "id",
        },
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "inventory_items",
          key: "id",
        },
      },
      ordered_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      received_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      damaged_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      returned_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      bill_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      ordered_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      received_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "InventoryTransaction",
      tableName: "inventory_transactions",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
  );
  return InventoryTransaction;
};
