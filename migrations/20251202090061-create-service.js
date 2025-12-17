'use strict';

const { ServiceGender, PriceType, DiscountType } = require("../models/service/service-types");

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
    CREATE TYPE "enum_service_gender" AS ENUM (
    '${ServiceGender.ENUM.MALE}', 
    '${ServiceGender.ENUM.FEMALE}', 
    '${ServiceGender.ENUM.UNISEX}');
    `);

    await queryInterface.sequelize.query(`
    CREATE TYPE "enum_service_price_type" AS ENUM (
    '${PriceType.ENUM.FROM}', 
    '${PriceType.ENUM.FIXED}', 
    '${PriceType.ENUM.FREE}');
    `);

    await queryInterface.sequelize.query(`
    CREATE TYPE "enum_service_discount_type" AS ENUM (
    '${DiscountType.ENUM.PERCENTAGE}', 
    '${DiscountType.ENUM.AMOUNT}');
    `);

    await queryInterface.createTable('services', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      logo: {
        type: Sequelize.STRING
      },
      salon_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'salons',
          key: 'id'
        }
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'categories',
          key: 'id'
        }
      },
      parent_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'services',
          key: 'id'
        }
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_popular: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      gender: {
        type: 'enum_service_gender',
        allowNull: false
      },
      price_type: {
        type: 'enum_service_price_type',
        allowNull: false
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      discount: {
        type: Sequelize.INTEGER
      },
      discount_type: {
        type: 'enum_service_discount_type',
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('services');

    await queryInterface.sequelize.query(`
    DROP TYPE "enum_service_gender";
    `);

    await queryInterface.sequelize.query(`
    DROP TYPE "enum_service_price_type";
    `);

    await queryInterface.sequelize.query(`
    DROP TYPE "enum_service_discount_type";
    `);

  }
};