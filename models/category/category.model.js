"use strict";
const { Model } = require("sequelize");
const { model } = require("../../repository/salon.repository");

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });

      this.hasMany(models.Service, {
        foreignKey: "category_id",
        as: "services",
      });
    }
  }
  Category.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      salon_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "salons",
          key: "id",
        },
        validate: {
          notNull: {
            msg: "Salon ID is required",
          },
          notEmpty: {
            msg: "Salon ID is required",
          },
        },
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
      modelName: "Category",
      tableName: "categories",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        {
          unique: true,
          fields: ["salon_id", "name"],
          name: "categories_salon_id_name_unique",
        },
      ],
    },
  );
  return Category;
};
