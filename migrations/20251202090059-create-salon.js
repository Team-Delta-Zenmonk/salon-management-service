'use strict';

const { SalonType } = require("../models/salon/salon-types");

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
    CREATE TYPE "enum_salon_type" AS ENUM (
    '${SalonType.ENUM.FEMALE}',
    '${SalonType.ENUM.MALE}', 
    '${SalonType.ENUM.UNISEX}'
    );
    `);

    await queryInterface.createTable('salons', {
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
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      owner_name: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      map_link: {
        type: Sequelize.STRING
      },
      about: {
        type: Sequelize.TEXT
      },
      logo: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.ENUM('enum_salon_type'),
      },
      reset_password_token: {
        type: Sequelize.STRING
      },
      reset_token_expiry: {
        type: Sequelize.DATE
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
    await queryInterface.sequelize.query(`
    DROP TYPE "enum_salon_type";
    `);
    await queryInterface.dropTable('salons');
  }
};