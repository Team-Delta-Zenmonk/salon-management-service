const { FORBIDDEN } = require("../libs/constants");

exports.subscriptionGateMiddleware = async (req, res, next) => {
  try {
    const salon = req.salon;

    if (!salon) {
      return res.status(FORBIDDEN).json({
        code: "AUTHENTICATION_REQUIRED",
        error: "Salon authentication is required before subscription check.",
      });
    }

    if (salon.is_active === false) {
      return res.status(FORBIDDEN).json({
        code: "ACCOUNT_INACTIVE",
        error: "Account not activated. Please contact ZenMonk support.",
      });
    }

    if (salon.subscription_status === "suspended") {
      return res.status(FORBIDDEN).json({
        code: "SUBSCRIPTION_SUSPENDED",
        error: "Your account has been suspended. Please contact ZenMonk support.",
      });
    }

    const now = new Date();
    const planStillActive =
      salon.subscription_expires_at &&
      new Date(salon.subscription_expires_at) > now;
    const trialStillActive =
      salon.trial_ends_at && new Date(salon.trial_ends_at) > now;

    if (planStillActive || trialStillActive) {
      if (salon.subscription_status === "expired") {
        await salon.update({ subscription_status: "active" });
      }
      return next();
    }

    if (salon.subscription_status !== "expired") {
      await salon.update({ subscription_status: "expired" });
    }

    return res.status(FORBIDDEN).json({
      code: "SUBSCRIPTION_EXPIRED",
      error:
        "Your subscription has expired. Please renew your plan to continue using operational features.",
    });
  } catch (error) {
    console.error("Error in subscriptionGateMiddleware:", error);
    return res.status(FORBIDDEN).json({
      code: "SUBSCRIPTION_CHECK_ERROR",
      error: error.message,
    });
  }
};
