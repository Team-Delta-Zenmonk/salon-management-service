const router = require("express").Router();
const { bookingController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { authMiddleware } = require("../middlewares");
const { createBookingSchema } = require("../schema/booking/create-booking.schema");
const { createAdminBookingSchema } = require("../schema/booking/create-admin-booking.schema");
const { listBookingsSchema } = require("../schema/booking/list-booking.schema");

router.post("/", validate(createBookingSchema), bookingController.createBooking);

router.post("/admin", authMiddleware.authSalonMiddleware, validate(createAdminBookingSchema), bookingController.createAdminBooking);

router.get("/", validate(listBookingsSchema), bookingController.listBookings);

module.exports = router;