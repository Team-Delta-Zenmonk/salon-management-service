"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const plans = [
      {
        code: "trial",
        name: "Free Trial",
        amount: 0,
        currency: "INR",
        billing_cycle: "trial",
        badge: "Pure Trial",
        description: "Full feature entitlement during initial trial",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: "monthly",
        name: "Monthly Plan",
        amount: 2499,
        currency: "INR",
        billing_cycle: "/ mo",
        badge: "With Trial",
        description: "Starts with trial days, then monthly billing",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        code: "yearly",
        name: "Yearly Plan",
        amount: 24990,
        currency: "INR",
        billing_cycle: "/ yr",
        badge: "Save 20%",
        description: "Starts with trial days, then annual billing (2 months free)",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingRows = await queryInterface.sequelize.query(
      `SELECT code FROM "subscription_plans" WHERE code IN ('trial', 'monthly', 'yearly');`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingCodes = existingRows.map((r) => r.code);

    const plansToInsert = plans.filter((p) => !existingCodes.includes(p.code));

    if (plansToInsert.length > 0) {
      await queryInterface.bulkInsert("subscription_plans", plansToInsert);
      console.log(`✅ Bulk seeded ${plansToInsert.length} subscription plan(s)`);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "subscription_plans",
      { code: ["trial", "monthly", "yearly"] },
      {}
    );
  },
};
