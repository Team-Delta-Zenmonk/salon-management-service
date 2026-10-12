"use strict";

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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("storefront_themes");
  },
};
