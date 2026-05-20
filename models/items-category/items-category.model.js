"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ItemsCategory extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });
      this.hasMany(models.InventoryItem, {
        foreignKey: "category_id",
        as: "items",
      });
    }
  }
  ItemsCategory.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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
      modelName: "ItemsCategory",
      tableName: "items_category",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        {
          unique: true,
          fields: ["salon_id", "name"],
          name: "items_category_salon_name_unique",
        },
      ],
    },
  );
  return ItemsCategory;
};
