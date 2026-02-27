const { SUCCESS } = require("../libs/constants");
const { customerService } = require("../services");

exports.getCustomerCart = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const response = await customerService.getCustomerCart({ customerUuid: uuid });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in getCustomerCart controller", error);
    return next(error);
  }
};
