"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("subscription_plans");

    if (!tableDefinition.uuid) {
      await queryInterface.addColumn("subscription_plans", "uuid", {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: true,
      });

      await queryInterface.sequelize.query(
        `UPDATE "subscription_plans" SET uuid = gen_random_uuid() WHERE uuid IS NULL;`
      );

      await queryInterface.changeColumn("subscription_plans", "uuid", {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("subscription_plans");

    if (tableDefinition.uuid) {
      await queryInterface.removeColumn("subscription_plans", "uuid");
    }
  },
};

