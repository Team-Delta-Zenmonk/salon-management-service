"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("booking_services", "staff_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM "booking_services" WHERE "staff_id" IS NULL;
    `);

    await queryInterface.changeColumn("booking_services", "staff_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};