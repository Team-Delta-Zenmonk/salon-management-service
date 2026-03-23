const router = require("express").Router();
const { paymentController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { authCustomerMiddleware } = require("../middlewares/auth.middleware");
const { createPaymentIntentSchema } = require("../schema/payment/create-payment-intent.schema");

router.post("/create-payment",authCustomerMiddleware, validate(createPaymentIntentSchema), paymentController.createPaymentIntent);

module.exports = router;
