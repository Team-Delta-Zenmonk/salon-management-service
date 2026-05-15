const router = require("express").Router();
const { authController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { loginSalonSchema } = require("../schema/auth/login-salon.schema");
const { forgotPasswordSchema } = require("../schema/auth/forgot-password.schema");
const { resetPasswordSchema } = require("../schema/auth/reset-password.schema");
const { loginCustomerSchema } = require("../schema/auth/login-customer.schema");

router.post("/login/salon", validate(loginSalonSchema), authController.loginSalon);
router.post("/forgot-password/salon", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password/salon", validate(resetPasswordSchema), authController.resetPassword);

router.post("/login/customer", validate(loginCustomerSchema), authController.loginCustomer);

module.exports = router;
