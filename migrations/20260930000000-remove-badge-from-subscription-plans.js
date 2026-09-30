"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("subscription_plans");
    if (tableDefinition.badge) {
      await queryInterface.removeColumn("subscription_plans", "badge");
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("subscription_plans");
    if (!tableDefinition.badge) {
      await queryInterface.addColumn("subscription_plans", "badge", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};
