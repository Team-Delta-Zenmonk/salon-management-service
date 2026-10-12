"use strict";

const crypto = require("crypto");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const themes = [
      {
        uuid: crypto.randomUUID(),
        code: "default",
        name: "Classic Minimal",
        price: 0,
        currency: "INR",
        preview_image: null,
        is_free: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        code: "modern_luxury",
        name: "Modern Velvet",
        price: 1999,
        currency: "INR",
        preview_image: null,
        is_free: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingRows = await queryInterface.sequelize.query(
      `SELECT code FROM "storefront_themes" WHERE code IN ('default', 'modern_luxury');`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingCodes = existingRows.map((r) => r.code);

    const themesToInsert = themes.filter((t) => !existingCodes.includes(t.code));

    if (themesToInsert.length > 0) {
      await queryInterface.bulkInsert("storefront_themes", themesToInsert);
      console.log(`✅ Bulk seeded ${themesToInsert.length} storefront theme(s)`);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "storefront_themes",
      {
        code: ["default", "modern_luxury"],
      },
      {}
    );
  },
};
