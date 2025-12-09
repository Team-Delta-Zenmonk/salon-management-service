"use strict";
const { Model } = require("sequelize");
const { ServiceGender, PriceType, DiscountType } = require("./service-types");

module.exports = (sequelize, DataTypes) => {
    class Service extends Model {

        static associate(models) {
            // define association here
            this.belongsTo(models.Salon, {
                foreignKey: "salon_id",
                as: "salon"
            });
            this.belongsTo(models.Category, {
                foreignKey: "category_id",
                as: "category"
            });
            this.belongsTo(models.Service, {
                foreignKey: "parent_id",
                as: "parent"
            });

            this.hasMany(models.Service, {
                foreignKey: "parent_id",
                as: "children"
            });
            this.hasMany(models.StaffService, {
                foreignKey: "service_id",
                as: "staff_service",
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            });
        }
    }
    Service.init(
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
            description: {
                type: DataTypes.STRING,
                allowNull: true
            },
            logo: {
                type: DataTypes.STRING,
                allowNull: true
            },
            salon_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'salons',
                    key: 'id'
                }
            },
            category_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'categories',
                    key: 'id'
                }
            },
            parent_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'services',
                    key: 'id'
                }
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            is_popular: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            gender: {
                type: DataTypes.ENUM(ServiceGender.getValues()),
                allowNull: false
            },
            price_type: {
                type: DataTypes.ENUM(PriceType.getValues()),
                allowNull: false
            },
            price: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            discount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            discount_type: {
                type: DataTypes.ENUM(DiscountType.getValues()),
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
            },
        },
        {
            sequelize,
            modelName: "Service",
            tableName: "services",
            paranoid: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
        }
    );
    return Service;
};
