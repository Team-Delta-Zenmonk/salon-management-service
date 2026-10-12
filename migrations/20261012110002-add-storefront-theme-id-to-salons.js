"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("salons", "storefront_theme_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: "storefront_themes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    await queryInterface
      .addIndex("salons", ["storefront_theme_id"], {
        name: "salons_storefront_theme_id_idx",
      })
      .catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("salons", "storefront_theme_id");
  },
};

