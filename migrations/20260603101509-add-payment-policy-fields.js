'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('salons', 'allowed_payment_policies', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: '["pay_at_venue"]'
    });
    await queryInterface.addColumn('salons', 'deposit_percentage', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    const salonDesc = await queryInterface.describeTable('salons');
    if (!salonDesc.allowed_payment_policies) {
      await queryInterface.addColumn('salons', 'allowed_payment_policies', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: '["pay_at_venue"]'
      });
    }
    if (!salonDesc.deposit_percentage) {
      await queryInterface.addColumn('salons', 'deposit_percentage', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

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
    const bookingDesc = await queryInterface.describeTable('bookings');
    if (!bookingDesc.payment_policy) {
      await queryInterface.addColumn('bookings', 'payment_policy', {
        type: Sequelize.ENUM('pay_at_venue', 'partial_deposit', 'full_upfront'),
        allowNull: true
      });
    }
    if (!bookingDesc.deposit_amount) {
      await queryInterface.addColumn('bookings', 'deposit_amount', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
    if (!bookingDesc.amount_paid_online) {
      await queryInterface.addColumn('bookings', 'amount_paid_online', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
    if (!bookingDesc.is_walk_in) {
      await queryInterface.addColumn('bookings', 'is_walk_in', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!bookingDesc.reschedule_count) {
      await queryInterface.addColumn('bookings', 'reschedule_count', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
    if (!bookingDesc.rescheduled_at) {
      await queryInterface.addColumn('bookings', 'rescheduled_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('bookings', 'amount_paid_online');
    await queryInterface.removeColumn('bookings', 'deposit_amount');
    await queryInterface.removeColumn('bookings', 'payment_policy');
    const bookingDesc = await queryInterface.describeTable('bookings');
    if (bookingDesc.rescheduled_at) await queryInterface.removeColumn('bookings', 'rescheduled_at');
    if (bookingDesc.reschedule_count) await queryInterface.removeColumn('bookings', 'reschedule_count');
    if (bookingDesc.is_walk_in) await queryInterface.removeColumn('bookings', 'is_walk_in');

    if (bookingDesc.amount_paid_online) await queryInterface.removeColumn('bookings', 'amount_paid_online');
    if (bookingDesc.deposit_amount) await queryInterface.removeColumn('bookings', 'deposit_amount');
    if (bookingDesc.payment_policy) await queryInterface.removeColumn('bookings', 'payment_policy');
    
    await queryInterface.removeColumn('salons', 'deposit_percentage');
    await queryInterface.removeColumn('salons', 'allowed_payment_policies');
    const salonDesc = await queryInterface.describeTable('salons');
    if (salonDesc.deposit_percentage) await queryInterface.removeColumn('salons', 'deposit_percentage');
    if (salonDesc.allowed_payment_policies) await queryInterface.removeColumn('salons', 'allowed_payment_policies');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_payment_policy" CASCADE;').catch(() => {});
  }
};
