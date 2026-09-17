"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { AdminRole } = require("../models/admin-user/admin-user-types");

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminEmail =
      process.env.DEFAULT_SUPER_ADMIN_EMAIL || "admin@zenmonk.com";
    const adminPassword =
      process.env.DEFAULT_SUPER_ADMIN_PASSWORD || "Password@123";
    const adminName =
      process.env.DEFAULT_SUPER_ADMIN_NAME || "ZenMonk Super Admin";

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existing = await queryInterface.rawSelect(
      "admin_users",
      {
        where: { email: adminEmail },
      },
      ["id"],
    );

    if (!existing) {
      await queryInterface.bulkInsert("admin_users", [
        {
          uuid: crypto.randomUUID(),
          name: adminName,
          email: adminEmail,
          password: passwordHash,
          role: AdminRole.ENUM.SUPER_ADMIN,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      console.log(`✅ Seeded default ZenMonk Super Admin (${adminEmail})`);
    }
  },

  async down(queryInterface, Sequelize) {
    const adminEmail =
      process.env.DEFAULT_SUPER_ADMIN_EMAIL || "admin@zenmonk.com";
    await queryInterface.bulkDelete("admin_users", { email: adminEmail }, {});
  },
};
