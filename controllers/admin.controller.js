const { SUCCESS, CREATED } = require("../libs/constants");
const { adminService } = require("../services");

exports.loginAdmin = async (req, res, next) => {
  try {
    const response = await adminService.loginAdmin({ body: req.body });
    res.cookie("admin_jwt", response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
      sameSite: "none",
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller loginAdmin", error);
    return next(error);
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
