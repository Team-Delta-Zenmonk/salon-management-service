"use strict";
const { Model } = require("sequelize");
const { InventoryItemType } = require("./inventory-item-types");

module.exports = (sequelize, DataTypes) => {
  class InventoryItem extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });
      this.belongsTo(models.ItemsCategory, {
        foreignKey: "category_id",
        as: "category",
      });
      this.hasMany(models.InventoryTransaction, {
        foreignKey: "item_id",
        as: "transactions",
      });
    }
  }
  InventoryItem.init(
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
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "items_category",
          key: "id",
        },
      },
      item_type: {
        type: DataTypes.ENUM(InventoryItemType.getValues()),
        allowNull: false,
        defaultValue: InventoryItemType.ENUM.PRODUCT,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      variant_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      current_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      min_stock_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      modelName: "InventoryItem",
      tableName: "inventory_items",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        {
          unique: true,
          fields: ["salon_id", "name", "brand", "variant_name"],
          name: "inventory_items_unique_constraint",
        },
      ],
    },
  );
  return InventoryItem;
};
