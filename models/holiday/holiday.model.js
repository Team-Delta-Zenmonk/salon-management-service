"use strict";
const { Model } = require("sequelize");
const { HolidayType } = require("./holiday-types");

module.exports = (sequelize, DataTypes) => {
  class Holiday extends Model {
    static associate(models) {
      Holiday.belongsTo(models.Salon, {
        foreignKey: "parent_id",
        constraints: false,
      });

      Holiday.belongsTo(models.Staff, {
        foreignKey: "parent_id",
        constraints: false,
      });
    }
  }
  Holiday.init(
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
      holiday_type: {
        type: DataTypes.ENUM(HolidayType.getValues()),
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      holiday_date: {
        type: DataTypes.DATE,
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
      modelName: "Holiday",
      tableName: "holidays",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
  );
  return Holiday;
};
