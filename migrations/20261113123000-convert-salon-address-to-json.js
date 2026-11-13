"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE salons ALTER COLUMN address TYPE json USING CASE
        WHEN address IS NULL OR trim(address::text) = '' THEN NULL
        WHEN address::text LIKE '{%}' THEN address::json
        ELSE json_build_object(
          'street', null,
          'city', null,
          'state', null,
          'pincode', null,
          'formatted_address', address
        )
      END;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE salons ALTER COLUMN address TYPE varchar(255) USING CASE
        WHEN address IS NULL THEN NULL
        WHEN (address->>'formatted_address') IS NOT NULL AND (address->>'formatted_address') != '' THEN substr(address->>'formatted_address', 1, 255)
        ELSE substr(address::text, 1, 255)
      END;
    `);
  },
};

