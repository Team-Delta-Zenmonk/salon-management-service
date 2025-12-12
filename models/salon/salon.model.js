"use strict";
const { Model } = require("sequelize");
const { SalonType } = require("./salon-types");
const { HolidayType } = require("../holiday/holiday-types");

module.exports = (sequelize, DataTypes) => {
    class Salon extends Model {
        static associate(models) {
            this.hasMany(models.Staff, {
                foreignKey: "salon_id",
                as: "staff",
            });
            this.hasMany(models.Category, {
                foreignKey: "salon_id",
                as: "categories"
            });

            this.hasMany(models.Service, {
                foreignKey: "salon_id",
                as: "services"
            });

            this.hasMany(models.Holiday, {
                foreignKey: "parent_id",
                constraints: false,
                as: "holidays",
                scope: {
                    holiday_type: HolidayType.ENUM.SALON
                }
            });
        }
    }
    Salon.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            uuid: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                unique: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true
            },
            latitude: {
                type: DataTypes.STRING,
                allowNull: true
            },
            longitude: {
                type: DataTypes.STRING,
                allowNull: true
            },
            owner_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM(SalonType.getValues()),
                allowNull: true
            },
            map_link: {
                type: DataTypes.STRING,
                allowNull: true
            },
            about: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            is_onboarded: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            logo: {
                type: DataTypes.STRING,
                allowNull: true
            },
            reset_password_token: {
                type: DataTypes.STRING,
                allowNull: true
            },
            reset_token_expiry: {
                type: DataTypes.DATE,
                allowNull: true
            },
            business_hours: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            photos: {
                type: DataTypes.JSON,
                allowNull: true
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            deleted_at: {
                type: DataTypes.DATE
            }
        },
        {
            sequelize,
            modelName: "Salon",
            tableName: "salons",
            paranoid: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
            defaultScope: {
                attributes: { exclude: ['password'] }
            },
            scopes: {
                withPassword: {
                    attributes: { include: ['password'] }
                }
            }
        }
    );
    return Salon;
};
