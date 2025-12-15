"use strict";

const { Model } = require("sequelize");
const {
    BookingType,
    BookingExecutionMode,
    BookingStatus,
} = require("./booking-types");

module.exports = (sequelize, DataTypes) => {
    class Booking extends Model {
        static associate(models) {
            this.hasMany(models.BookingService, {
                foreignKey: "booking_id",
                as: "booking_services",
            });

            this.belongsTo(models.Customer, {
                foreignKey: "customer_id",
                as: "customer",
            });

            this.belongsTo(models.Salon, {
                foreignKey: "salon_id",
                as: "salon",
            });
        }
    }

    Booking.init(
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
                allowNull: false,
                unique: true,
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
            },
            total_duration: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            booking_type: {
                type: DataTypes.ENUM(BookingType.getValues()),
                allowNull: false,
            },
            booking_execution_mode: {
                type: DataTypes.ENUM(BookingExecutionMode.getValues()),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM(BookingStatus.getValues()),
                allowNull: false,
            },
            booking_start_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            booking_end_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            booking_date: {
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
            modelName: "Booking",
            tableName: "bookings",
            paranoid: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            deletedAt: "deleted_at",
        }
    );

    return Booking;
};
