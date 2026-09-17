const { SUCCESS } = require("../libs/constants");
const { storefrontService } = require("../services");

exports.getStorefrontProfile = async (req, res, next) => {
  try {
    const response = await storefrontService.getStorefrontProfile({
      params: req.params,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller getStorefrontProfile", error);
    return next(error);
  }
};

exports.getStorefrontServices = async (req, res, next) => {
  try {
    const response = await storefrontService.getStorefrontServices({
      params: req.params,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller getStorefrontServices", error);
    return next(error);
  }
};

exports.getStorefrontStaff = async (req, res, next) => {
  try {
    const response = await storefrontService.getStorefrontStaff({
      params: req.params,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller getStorefrontStaff", error);
    return next(error);
  }
};
