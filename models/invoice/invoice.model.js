"use strict";

const { Model } = require("sequelize");
const { InvoiceType } = require("./invoice-types");

module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, {
        foreignKey: "booking_id",
        as: "booking",
      });

      this.belongsTo(models.Salon, {
        foreignKey: "salon_id",
        as: "salon",
      });

      if (models.StorefrontTheme) {
        this.belongsTo(models.StorefrontTheme, {
          foreignKey: "theme_id",
          as: "theme",
        });
      }
    }
  }

  Invoice.init(
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
      invoice_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      invoice_type: {
        type: DataTypes.ENUM(InvoiceType.getValues()),
        allowNull: false,
        defaultValue: InvoiceType.ENUM.BOOKING,
      },
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "bookings",
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
      theme_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      grand_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      balance_due: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "INR",
      },
      payment_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "PENDING",
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
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
      },
      stripe_client_secret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      invoice_url: {
        type: DataTypes.STRING(500),
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
      modelName: "Invoice",
      tableName: "invoices",
      paranoid: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Invoice;
};
