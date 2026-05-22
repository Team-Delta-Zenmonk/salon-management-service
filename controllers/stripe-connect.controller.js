const { SUCCESS } = require("../libs/constants");
const { stripeConnectService } = require("../services");

exports.createOnboardingLink = async (req, res, next) => {
  try {
    const salonId = req.salon.id;
    const message = await stripeConnectService.createOnboardingLink(salonId);
    return res.status(SUCCESS).json({ message });
  } catch (error) {
    console.log("Error in controller createOnboardingLink", error);
    return next(error);
  }
};

exports.createDashboardLoginLink = async (req, res, next) => {
  try {
    const salonId = req.salon.id;
    const message = await stripeConnectService.createDashboardLoginLink(salonId);
    return res.status(SUCCESS).json({ message });
  } catch (error) {
    console.log("Error in controller createDashboardLoginLink", error);
    return next(error);
  }
};
