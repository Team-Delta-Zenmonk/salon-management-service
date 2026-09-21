"use strict";

const { Model } = require("sequelize");
const {
  SubscriptionInvoiceStatus,
  SubscriptionBillingCycle,
} = require("./subscription-invoice-types");

module.exports = (sequelize, DataTypes) => {
  class SubscriptionInvoice extends Model {
    static associate(models) {
      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });
    }
  }

  SubscriptionInvoice.init(
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
      invoice_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      plan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      billing_cycle: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: SubscriptionBillingCycle.ENUM.MONTHLY,
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
        type: DataTypes.ENUM(SubscriptionInvoiceStatus.getValues()),
        allowNull: false,
        defaultValue: SubscriptionInvoiceStatus.ENUM.PAID,
      },
      discount_details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
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
      billing_period_start: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      billing_period_end: {
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
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "SubscriptionInvoice",
      tableName: "subscription_invoices",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        {
          fields: ["salon_id"],
        },
        {
          unique: true,
          fields: ["invoice_number"],
        },
        {
          unique: true,
          fields: ["stripe_payment_intent_id"],
        },
      ],
    },
  );

  return SubscriptionInvoice;
};
