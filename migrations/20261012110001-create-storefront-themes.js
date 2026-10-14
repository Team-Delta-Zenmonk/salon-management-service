"use strict";

const crypto = require("crypto");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("storefront_themes", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "INR",
      },
      preview_image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_free: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface
      .addIndex("storefront_themes", ["code"], {
        unique: true,
        name: "storefront_themes_code_unique",
      })
      .catch(() => {});

    const now = new Date();
    await queryInterface.bulkInsert("storefront_themes", [
      {
        uuid: crypto.randomUUID(),
        code: "crimsonShear",
        name: "Atelier Solstice (Warm Alabaster Luxury)",
        price: 0,
        currency: "INR",
        preview_image: "/atelierSolstice.png",
        is_free: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        code: "obsidianFlame",
        name: "Obsidian Flame (Ultra Dark Gold)",
        price: 1999,
        currency: "INR",
        preview_image: "/obsidianFlame.png",
        is_free: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        code: "lightGothic",
        name: "Light Gothic (Luxury Light)",
        price: 1499,
        currency: "INR",
        preview_image: "/lightGothic.png",
        is_free: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("storefront_themes");
  },
};
