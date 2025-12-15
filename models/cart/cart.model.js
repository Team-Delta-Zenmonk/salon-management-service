"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, {
        foreignKey: "customer_id",
        as: "customer",
      });
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });
      this.hasMany(models.CartItem, {
        foreignKey: "cart_id",
        as: "cart_items",
      });
    }
  }

  Cart.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
      },
      salon_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "salons",
          key: "id",
        },
      },
      total_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_duration: {
        type: DataTypes.INTEGER, // in minutes
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
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Cart",
      tableName: "carts",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Cart;
};
