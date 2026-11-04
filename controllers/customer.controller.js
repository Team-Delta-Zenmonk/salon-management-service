const { SUCCESS } = require("../libs/constants");
const { customerService } = require("../services");

exports.getCustomerCart = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const response = await customerService.getCustomerCart({
      customerUuid: uuid,
      query: req.query,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in getCustomerCart controller", error);
    return next(error);
  }
};

exports.updateCustomerProfile = async (req, res, next) => {
  try {
    const response = await customerService.updateCustomerProfile({
      customer: req.user,
      body: req.body,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in updateCustomerProfile controller", error);
    return next(error);
  }
};

exports.generateCustomerPresignedUrl = async (req, res, next) => {
  try {
    const response = await customerService.generateCustomerPresignedUrl({
      customer: req.user,
      files: req.body.files,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in generateCustomerPresignedUrl controller", error);
    return next(error);
  }
};
