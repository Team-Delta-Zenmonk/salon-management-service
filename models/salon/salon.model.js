"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Salon extends Model {

        static associate(models) {
            // define association here
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
            reset_password_token: {
                type: DataTypes.STRING,
                allowNull: true
            },
            reset_token_expiry: {
                type: DataTypes.DATE,
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
