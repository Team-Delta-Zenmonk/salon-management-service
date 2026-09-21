const { authService } = require("../services");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

exports.loginSalon = async (req, res, next) => {
  try {
    const response = await authService.loginSalon({ body: req.body });
    res.cookie("salon_jwt", response.token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie("salon_refresh_jwt", response.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in controller loginSalon", error);
    return next(error);
  }
};

exports.refreshSalon = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.salon_refresh_jwt || req.body?.refreshToken;
    const response = await authService.refreshSalonToken(refreshToken);
    res.cookie("salon_jwt", response.token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in controller refreshSalon", error);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const response = await authService.forgotPassword({ body: req.body });
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in controller forgotPassword", error);
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const response = await authService.resetPassword({ body: req.body });
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in controller resetPassword", error);
    return next(error);
  }
};

exports.loginCustomer = async (req, res, next) => {
  try {
    const response = await authService.loginCustomer({ body: req.body });
    res.cookie("customer_jwt", response.token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie("customer_refresh_jwt", response.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in controller loginCustomer", error);
    return next(error);
  }
};

exports.refreshCustomer = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.customer_refresh_jwt || req.body?.refreshToken;
    const response = await authService.refreshCustomerToken(refreshToken);
    res.cookie("customer_jwt", response.token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in controller refreshCustomer", error);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};
