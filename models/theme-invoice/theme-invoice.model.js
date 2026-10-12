"use strict";

const { Model } = require("sequelize");
const { ThemeInvoiceStatus, ThemePaymentMethod } = require("./theme-invoice-types");

module.exports = (sequelize, DataTypes) => {
  class ThemeInvoice extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });
      this.belongsTo(models.StorefrontTheme, {
        foreignKey: "theme_id",
        as: "theme",
      });
    }
  }

  ThemeInvoice.init(
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
      salon_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      theme_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      invoice_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "INR",
      },
      status: {
        type: DataTypes.ENUM(ThemeInvoiceStatus.getValues()),
        allowNull: false,
        defaultValue: ThemeInvoiceStatus.ENUM.PENDING,
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ThemePaymentMethod.ENUM.CARD,
      },
      payment_details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripe_payment_intent_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      stripe_client_secret: {
        type: DataTypes.STRING,
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
      modelName: "ThemeInvoice",
      tableName: "theme_invoices",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        {
          unique: true,
          fields: ["salon_id", "theme_id"],
          name: "theme_invoices_salon_theme_unique",
        },
      ],
    }
  );

  return ThemeInvoice;
};

