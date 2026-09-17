const cron = require("node-cron");
const { Salon } = require("../models");
const { Op } = require("sequelize");

const expireSubscriptions = async () => {
  try {
    const now = new Date();

    const [expiredTrials] = await Salon.update(
      { subscription_status: "expired" },
      {
        where: {
          subscription_status: "trial",
          trial_ends_at: {
            [Op.ne]: null,
            [Op.lt]: now,
          },
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
        },
      },
    );

    if (expiredTrials > 0 || expiredPlans > 0) {
      console.log(
        `[SubscriptionExpiryJob] Automatically expired ${expiredTrials} trial(s) and ${expiredPlans} paid plan(s).`,
      );
    }
  } catch (error) {
    console.error(
      "[SubscriptionExpiryJob] Error running subscription expiry job:",
      error.message,
    );
  }
};

cron.schedule("0 0 * * *", async () => {
  console.log(
    "[SubscriptionExpiryJob] Running scheduled midnight subscription expiry check...",
  );
  await expireSubscriptions();
});

module.exports = {
  expireSubscriptions,
};
