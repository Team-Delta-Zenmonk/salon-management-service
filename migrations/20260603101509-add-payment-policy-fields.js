'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('salons', 'payment_policy', {
      type: Sequelize.ENUM('pay_at_venue', 'partial_deposit', 'full_upfront'),
      allowNull: false,
      defaultValue: 'full_upfront'
    });
    await queryInterface.addColumn('salons', 'deposit_percentage', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('bookings', 'payment_policy', {
      type: Sequelize.ENUM('pay_at_venue', 'partial_deposit', 'full_upfront'),
      allowNull: true
    });
    await queryInterface.addColumn('bookings', 'deposit_amount', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('bookings', 'amount_paid_online', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('bookings', 'amount_paid_online');
    await queryInterface.removeColumn('bookings', 'deposit_amount');
    await queryInterface.removeColumn('bookings', 'payment_policy');
    
    await queryInterface.removeColumn('salons', 'deposit_percentage');
    await queryInterface.removeColumn('salons', 'payment_policy');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_salons_payment_policy" CASCADE;').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_payment_policy" CASCADE;').catch(() => {});
  }
};
