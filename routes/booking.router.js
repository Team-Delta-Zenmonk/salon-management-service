const router = require("express").Router();
const { bookingController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { authMiddleware } = require("../middlewares");
const { authCustomerMiddleware } = require("../middlewares/auth.middleware");
const { createBookingSchema } = require("../schema/booking/create-booking.schema");
const { createAdminBookingSchema } = require("../schema/booking/create-admin-booking.schema");
const { updateAdminBookingSchema } = require("../schema/booking/update-admin-booking.schema");
const { deleteAdminBookingSchema } = require("../schema/booking/delete-admin-booking.schema");
const { listBookingsSchema } = require("../schema/booking/list-booking.schema");
const { listCustomerBookingsSchema } = require("../schema/booking/list-customer-bookings.schema");
const { cancelBookingSchema } = require("../schema/booking/cancel-booking-schema");

router.post("/", authCustomerMiddleware, validate(createBookingSchema), bookingController.createBooking);
router.post("/admin", authMiddleware.authSalonMiddleware, validate(createAdminBookingSchema), bookingController.createAdminBooking,);
router.put("/admin/:uuid", authMiddleware.authSalonMiddleware, validate(updateAdminBookingSchema), bookingController.updateAdminBooking,);
router.delete("/admin/:uuid",authMiddleware.authSalonMiddleware, validate(deleteAdminBookingSchema), bookingController.deleteAdminBooking,);
router.get("/", authMiddleware.authSalonMiddleware, validate(listBookingsSchema), bookingController.listBookings);
router.get("/history",authCustomerMiddleware, validate(listCustomerBookingsSchema), bookingController.listCustomerBookings,);
router.get("/active", authCustomerMiddleware, bookingController.getActiveBooking);
router.get("/:uuid", authCustomerMiddleware, bookingController.getBookingByUuid);
router.post("/:uuid/cancel", authCustomerMiddleware, validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;
