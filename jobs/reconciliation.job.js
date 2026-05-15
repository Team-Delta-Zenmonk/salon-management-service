const cron = require("node-cron");
const { reconciliationService } = require("../services");

cron.schedule("*/5 * * * *", async () => {
  console.log("Running reconciliation job...");
  await reconciliationService.reconcilePayments();
});
