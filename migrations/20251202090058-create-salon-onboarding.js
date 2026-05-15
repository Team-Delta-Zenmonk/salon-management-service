"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("salon_onboardings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.STRING,
      },
      otp: {
        type: Sequelize.STRING,
      },
      otp_created_at: {
        type: Sequelize.DATE,
      },
      otp_expires_at: {
        type: Sequelize.DATE,
      },
      resend_count_hour: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_resend_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex("salon_onboardings", ["email"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("salon_onboardings");
  },
};
