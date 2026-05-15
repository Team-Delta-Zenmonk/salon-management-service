"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("bookings");

    const [enumResult] = await queryInterface.sequelize.query(`
       SELECT 1 FROM pg_type WHERE typname = 'enum_booking_created_by';
    `);

    if (enumResult.length === 0) {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_booking_created_by" AS ENUM ('ADMIN', 'CUSTOMER');
      `);
    }

    if (tableDesc.customer_id && !tableDesc.customer_id.allowNull) {
      await queryInterface.changeColumn("bookings", "customer_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }

    if (!tableDesc.admin_booking) {
      await queryInterface.addColumn("bookings", "admin_booking", {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    if (!tableDesc.created_by) {
      await queryInterface.addColumn("bookings", "created_by", {
        type: "enum_booking_created_by",
        allowNull: false,
        defaultValue: "CUSTOMER",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("bookings");

    if (tableDesc.created_by) {
      await queryInterface.removeColumn("bookings", "created_by");
    }

    if (tableDesc.admin_booking) {
      await queryInterface.removeColumn("bookings", "admin_booking");
    }

    await queryInterface.changeColumn("bookings", "customer_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    const [enumResult] = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_booking_created_by';
    `);
    if (enumResult.length > 0) {
      await queryInterface.sequelize.query(`
         DROP TYPE "enum_booking_created_by";
      `);
    }
  },
};
