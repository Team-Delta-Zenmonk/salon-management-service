const calculateEndOfDayExpiry = (baseDate, durationDays = 0) => {
  const target = new Date(
    baseDate instanceof Date ? baseDate.getTime() : (baseDate || Date.now()),
  );
  const numDays = Math.max(0, Number(durationDays) || 0);

  target.setUTCDate(target.getUTCDate() + numDays);

  target.setUTCHours(23, 59, 59, 999);

  return target;
};

const resolveEffectiveSubscriptionStatus = (salon, now = new Date()) => {
  const planStillActive =
    salon.subscription_expires_at &&
    new Date(salon.subscription_expires_at) > now;
  const trialStillActive =
    salon.trial_ends_at &&
    new Date(salon.trial_ends_at) > now;

  if (salon.subscription_plan && salon.subscription_plan !== "trial") {
    if (planStillActive) {
      return "active";
    }
    if (trialStillActive) {
      return "trial";
    }
    return "expired";
  }

  if (trialStillActive || planStillActive) {
    return "trial";
  }
  return "expired";
};

module.exports = {
  calculateEndOfDayExpiry,
  resolveEffectiveSubscriptionStatus,
};
