"use strict";

const {
  SalonType,
  RegisteredBy,
  SubscriptionPlan,
  SubscriptionStatus,
} = require("../models/salon/salon-types");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_salon_type" AS ENUM (
        '${SalonType.ENUM.FEMALE}',
        '${SalonType.ENUM.MALE}', 
        '${SalonType.ENUM.UNISEX}'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_salons_registered_by" AS ENUM (
        '${RegisteredBy.ENUM.SELF}',
        '${RegisteredBy.ENUM.ADMIN}'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_salons_subscription_plan" AS ENUM (
        '${SubscriptionPlan.ENUM.TRIAL}',
        '${SubscriptionPlan.ENUM.MONTHLY}',
        '${SubscriptionPlan.ENUM.YEARLY}'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_salons_subscription_status" AS ENUM (
        '${SubscriptionStatus.ENUM.TRIAL}',
        '${SubscriptionStatus.ENUM.ACTIVE}',
        '${SubscriptionStatus.ENUM.EXPIRED}',
        '${SubscriptionStatus.ENUM.SUSPENDED}',
        '${SubscriptionStatus.ENUM.PENDING_PAYMENT}'
      );
    `);

    await queryInterface.createTable("salons", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      owner_name: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
      },
      latitude: {
        type: Sequelize.DOUBLE,
      },
      longitude: {
        type: Sequelize.DOUBLE,
      },
      address: {
        type: Sequelize.STRING,
      },
      map_link: {
        type: Sequelize.STRING,
      },
      about: {
        type: Sequelize.TEXT,
      },
      logo: {
        type: Sequelize.STRING,
      },
      type: {
        type: "enum_salon_type",
      },
      is_onboarded: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      registered_by: {
        type: "enum_salons_registered_by",
        defaultValue: RegisteredBy.ENUM.SELF,
        allowNull: false,
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      subscription_plan: {
        type: "enum_salons_subscription_plan",
        defaultValue: SubscriptionPlan.ENUM.TRIAL,
        allowNull: false,
      },
      subscription_status: {
        type: "enum_salons_subscription_status",
        defaultValue: SubscriptionStatus.ENUM.TRIAL,
        allowNull: false,
      },
      subscription_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reset_password_token: {
        type: Sequelize.STRING,
      },
      reset_token_expiry: {
        type: Sequelize.DATE,
      },
      business_hours: {
        type: Sequelize.JSON,
      },
      photos: {
        type: Sequelize.JSON,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface
      .addIndex("salons", ["slug"], {
        unique: true,
        name: "salons_slug_unique",
      })
      .catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface
      .removeIndex("salons", "salons_slug_unique")
      .catch(() => {});
    await queryInterface.dropTable("salons");

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_salons_subscription_status" CASCADE;
      DROP TYPE IF EXISTS "enum_salons_subscription_plan" CASCADE;
      DROP TYPE IF EXISTS "enum_salons_registered_by" CASCADE;
      DROP TYPE IF EXISTS "enum_salon_type" CASCADE;
    `);
  },
};
