"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "salons" ALTER COLUMN "subscription_plan" DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "salons" 
      ALTER COLUMN "subscription_plan" TYPE VARCHAR(255) USING "subscription_plan"::text;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "salons" ALTER COLUMN "subscription_plan" SET DEFAULT 'trial';
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_salons_subscription_plan" CASCADE;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_salons_subscription_plan" AS ENUM ('trial', 'monthly', 'yearly');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "salons" ALTER COLUMN "subscription_plan" DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "salons" 
      ALTER COLUMN "subscription_plan" TYPE "enum_salons_subscription_plan" 
      USING (
        CASE 
          WHEN "subscription_plan" IN ('trial', 'monthly', 'yearly') THEN "subscription_plan"::"enum_salons_subscription_plan"
          ELSE 'trial'::"enum_salons_subscription_plan"
        END
      );
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "salons" ALTER COLUMN "subscription_plan" SET DEFAULT 'trial'::"enum_salons_subscription_plan";
    `);
  },
};
