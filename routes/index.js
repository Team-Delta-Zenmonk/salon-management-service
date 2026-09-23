const { authMiddleware, subscriptionMiddleware } = require("../middlewares");

const router = require("express").Router();

const salonOperationalGate = [
  authMiddleware.authSalonMiddleware,
  subscriptionMiddleware.subscriptionGateMiddleware,
];

router.use("/auth", require("./auth.router"));
router.use("/salon-onboardings", require("./salon-onboarding.router"));
router.use("/salons/services", salonOperationalGate, require("./service.router"));
router.use("/salons/categories", salonOperationalGate, require("./category.router"));
router.use("/salons/staffs", salonOperationalGate, require("./staff.router"));
router.use("/salons/staff-services", salonOperationalGate, require("./staff-service.router"));
router.use("/salons/holidays", salonOperationalGate, require("./holiday.router"));
router.use("/salons/upload-images", require("./upload.router"));
router.use("/salons/inventory-items", salonOperationalGate, require("./inventory-items.router"));
router.use("/salons/items-category", salonOperationalGate, require("./items-category.router"));
router.use("/salons/inventory-transactions", salonOperationalGate, require("./inventory-transactions.router"));
router.use("/salons/stripe", require("./stripe-connect.router"));
router.use("/salons", require("./salon.router"));
router.use("/cart", authMiddleware.authCustomerMiddleware, require("./cart.router"));
router.use("/customers", require("./customer.router"));
router.use("/bookings", require("./booking.router"));
router.use("/payments", require("./payment.router"));
router.use("/admin", require("./admin.router"));
router.use("/storefront", require("./storefront.router"));
router.use("/invoices", require("./invoice.router"));
router.use("/notifications", require("./notification.router"));

router.get("/", (req, res, next) => {
  res.send("Salon Management Service is running");
});

module.exports = router;
