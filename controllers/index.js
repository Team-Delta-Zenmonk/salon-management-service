const { staffService } = require("../services");

module.exports = {
  salonController: require("./salon.controller"),
  salonOnboardingController: require("./salon-onboarding.controller"),
  authController: require("./auth.controller"),
  categoryController: require("./category.controller"),
  staffController: require("./staff.controller"),
  serviceController: require("./service.controller"),
  staffServiceController: require("./staff-service.controller"),
  uploadController: require("./upload.controller"),
  cartController: require("./cart.controller"),
  holidayController: require("./holiday.controller"),
  bookingController: require("./booking.controller"),
  customerController: require("./customer.controller"),
  paymentController: require("./payment.controller"),
  stripeController: require("./stripe.controller"),
  itemsCategoryController: require("./items-category.controller"),
  inventoryItemController: require("./inventory-item.controller"),
  inventoryTransactionController: require("./inventory-transaction.controller"),
  stripeConnectController: require("./stripe-connect.controller"),
};
