"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const bookingDesc = await queryInterface.describeTable("bookings");
    if (!bookingDesc.max_reschedule_attempts) {
      await queryInterface.addColumn("bookings", "max_reschedule_attempts", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const bookingDesc = await queryInterface.describeTable("bookings");
    if (bookingDesc.max_reschedule_attempts) {
      await queryInterface.removeColumn("bookings", "max_reschedule_attempts");
    }
  },
};
