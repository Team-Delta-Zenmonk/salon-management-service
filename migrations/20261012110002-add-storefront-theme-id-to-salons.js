"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [themes] = await queryInterface.sequelize.query(
      `SELECT id FROM "storefront_themes" WHERE is_free = true AND is_active = true ORDER BY id ASC LIMIT 1;`
    );

    const defaultThemeId = themes && themes.length > 0 ? themes[0].id : 1;

    await queryInterface.addColumn("salons", "storefront_theme_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "storefront_themes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    await queryInterface.sequelize.query(
      `UPDATE "salons" 
       SET storefront_theme_id = :defaultThemeId
       WHERE storefront_theme_id IS NULL;`,
      {
        replacements: { defaultThemeId },
      }
    );

    await queryInterface.changeColumn("salons", "storefront_theme_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: defaultThemeId,
    });

    await queryInterface
      .addIndex("salons", ["storefront_theme_id"], {
        name: "salons_storefront_theme_id_idx",
      })
      .catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface
      .removeIndex("salons", "salons_storefront_theme_id_idx")
      .catch(() => {});

    await queryInterface.removeColumn("salons", "storefront_theme_id");
  },
};
