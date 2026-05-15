const { SUCCESS } = require("../libs/constants");
const { paymentService } = require("../services");

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const response = await paymentService.createPaymentIntent({ body: req.body, user: req.user });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller createPaymentIntent", error);
    return next(error);
  }
};
