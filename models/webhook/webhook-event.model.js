"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WebhookEvent extends Model {}

  WebhookEvent.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      event_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      event_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      payload: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      processed_at: {
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
    },
    {
      sequelize,
      modelName: "WebhookEvent",
      tableName: "webhook_events",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return WebhookEvent;
};
