"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BookingService extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, {
        foreignKey: "booking_id",
        as: "booking",
      });

      this.belongsTo(models.Service, {
        foreignKey: "service_id",
        as: "service",
      });

      this.belongsTo(models.Staff, {
        foreignKey: "staff_id",
        as: "staff",
      });
    }
  }

  BookingService.init(
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
        allowNull: false,
        unique: true,
      },
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "bookings",
          key: "id",
        },
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
      },
      staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "staff",
          key: "id",
        },
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      offset_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BookingService",
      tableName: "booking_services",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
  );

  return BookingService;
};
