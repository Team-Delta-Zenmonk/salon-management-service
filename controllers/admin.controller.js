const { SUCCESS, CREATED } = require("../libs/constants");
const { adminService } = require("../services");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

exports.loginAdmin = async (req, res, next) => {
  try {
    const response = await adminService.loginAdmin({ body: req.body });
    res.cookie("admin_jwt", response.token, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("admin_refresh_jwt", response.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller loginAdmin", error);
    return next(error);
  }
};

exports.refreshAdmin = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.admin_refresh_jwt || req.body?.refreshToken;
    const response = await adminService.refreshAdminToken(refreshToken);
    res.cookie("admin_jwt", response.token, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller refreshAdmin", error);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

exports.listSalons = async (req, res, next) => {
  try {
    const response = await adminService.listSalons({ query: req.query });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller listSalons", error);
    return next(error);
  }
};

exports.createSalon = async (req, res, next) => {
  try {
    const response = await adminService.createSalon({ body: req.body });
    return res.status(CREATED).json(response);
  } catch (error) {
    console.log("Error in controller createSalon", error);
    return next(error);
  }
};

exports.updateSalonStatus = async (req, res, next) => {
  try {
    const response = await adminService.updateSalonStatus({
      params: req.params,
      body: req.body,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller updateSalonStatus", error);
    return next(error);
  }
};

exports.updateSalonPlan = async (req, res, next) => {
  try {
    const response = await adminService.updateSalonPlan({
      params: req.params,
      body: req.body,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller updateSalonPlan", error);
    return next(error);
  }
};

exports.getSubscriptionPlans = async (req, res, next) => {
  try {
    const response = await adminService.getSubscriptionPlans();
    return res.status(SUCCESS).json({ plans: response });
  } catch (error) {
    console.log("Error in controller getSubscriptionPlans", error);
    return next(error);
  }
};

exports.updateSubscriptionPlan = async (req, res, next) => {
  try {
    const response = await adminService.updateSubscriptionPlan({
      params: req.params,
      body: req.body,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller updateSubscriptionPlan", error);
    return next(error);
  }
};
