"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class CartItem extends Model {
        static associate(models) {
            this.belongsTo(models.Cart, {
                foreignKey: "cart_id",
                as: "cart",
            });
            this.belongsTo(models.Staff, {
                foreignKey: "staff_id",
                as: "staff",
            });
            this.belongsTo(models.Service, {
                foreignKey: "service_id",
                as: "service",
            });
        }
    }

    CartItem.init(
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
            cart_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "carts",
                    key: "id",
                },
            },
            staff_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "staffs",
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
            price: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            duration: {
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
            modelName: "CartItem",
            tableName: "cart_items",
            paranoid: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            deletedAt: "deleted_at",
        }
    );

    return CartItem;
};
