"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("subscription_plans", "duration_days", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30,
    });

    await queryInterface.sequelize.query(
      `UPDATE "subscription_plans" SET duration_days = 14 WHERE code = 'trial';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "subscription_plans" SET duration_days = 30 WHERE code = 'monthly';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "subscription_plans" SET duration_days = 365 WHERE code = 'yearly';`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("subscription_plans", "duration_days");
  },
};
