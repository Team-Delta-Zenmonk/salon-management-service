"use strict";
const { Model } = require("sequelize");
const { PriceType } = require('../service/service-types');

module.exports = (sequelize, DataTypes) => {
  class StaffService extends Model {
    static associate(models) {
      this.belongsTo(models.Service, {
        foreignKey: "service_id",
        as: "service",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      this.belongsTo(models.Staff, {
        foreignKey: "staff_id",
        as: "staff",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  StaffService.init(
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
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price_type: {
        type: DataTypes.ENUM(PriceType.getValues()),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
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
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "StaffService",
      tableName: "staff_services",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return StaffService;
};
