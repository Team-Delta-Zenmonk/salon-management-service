const cron = require("node-cron");
const { Salon } = require("../models");
const { Op } = require("sequelize");

const expireSubscriptions = async () => {
  try {
    const now = new Date();

    const [reactivated] = await Salon.update(
      { subscription_status: "active" },
      {
        where: {
          subscription_status: "expired",
          subscription_expires_at: { [Op.ne]: null, [Op.gt]: now },
        },
      },
    );

    const [expiredTrials] = await Salon.update(
      { subscription_status: "expired" },
      {
        where: {
          subscription_status: "trial",
          trial_ends_at: {
            [Op.ne]: null,
            [Op.lt]: now,
          },
          [Op.or]: [
            { subscription_expires_at: null },
            { subscription_expires_at: { [Op.lt]: now } },
          ],
        },
      },
    );

    const [expiredPlans] = await Salon.update(
      { subscription_status: "expired" },
      {
        where: {
          subscription_status: "active",
          subscription_expires_at: {
            [Op.ne]: null,
            [Op.lt]: now,
          },
          [Op.or]: [
            { trial_ends_at: null },
            { trial_ends_at: { [Op.lt]: now } },
          ],
        },
      },
    );

    if (reactivated > 0 || expiredTrials > 0 || expiredPlans > 0) {
      console.log(
        `[SubscriptionExpiryJob] Reactivated ${reactivated} salon(s). Expired ${expiredTrials} trial(s) and ${expiredPlans} paid plan(s).`,
      );
    }
  } catch (error) {
    console.error(
      "[SubscriptionExpiryJob] Error running subscription expiry job:",
      error.message,
    );
  }
};

cron.schedule("0 * * * *", async () => {
  console.log(
    "[SubscriptionExpiryJob] Running hourly subscription expiry check...",
  );
  await expireSubscriptions();
});

module.exports = {
  expireSubscriptions,
};
