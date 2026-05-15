"use strict";
const { Model } = require("sequelize");
const { ServiceGender } = require("../service/service-types");
const { HolidayType } = require("../holiday/holiday-types");

module.exports = (sequelize, DataTypes) => {
  class Staff extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });

      this.hasMany(models.StaffService, {
        foreignKey: "staff_id",
        as: "staff_service",
        onUpdate: "CASCADE",
      });
      this.hasMany(models.CartItem, {
        foreignKey: "staff_id",
        as: "cart_items",
      });

      this.hasMany(models.Holiday, {
        foreignKey: "parent_id",
        constraints: false,
        as: "holidays",
        scope: {
          holiday_type: HolidayType.ENUM.STAFF,
        },
      });

      this.hasMany(models.BookingService, {
        foreignKey: "staff_id",
        as: "booking_services",
      });
    }
  }

  Staff.init(
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
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      additional_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dob: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      joining_date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emergency_contact: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM(ServiceGender.getValues()),
        allowNull: false,
      },
      active_hours: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      photos: {
        type: DataTypes.JSON,
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
      modelName: "Staff",
      tableName: "staffs",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
  );

  return Staff;
};
