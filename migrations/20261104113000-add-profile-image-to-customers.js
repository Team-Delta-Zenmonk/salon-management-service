"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("customers");

    if (!tableDefinition.profile_image) {
      await queryInterface.addColumn("customers", "profile_image", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("customers");

    if (tableDefinition.profile_image) {
      await queryInterface.removeColumn("customers", "profile_image");
    }
  },
};
