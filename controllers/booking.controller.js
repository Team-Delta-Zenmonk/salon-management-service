const { CREATED, SUCCESS } = require("../libs/constants");
const { bookingService } = require("../services");

exports.createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking({ body: req.body });
    return res.status(CREATED).json(booking);
  } catch (error) {
    console.log("error in createBooking controller", error);
    next(error);
  }
};

exports.createAdminBooking = async (req, res, next) => {
  try {
    await bookingService.createAdminBooking({ body: req.body, salon: req.salon });
    return res.status(CREATED).json({ message: "Booking created successfully" });
  } catch (error) {
    console.log("error in createAdminBooking controller", error);
    next(error);
  }
};

exports.listBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.listBookings({ query: req.query, salon: req.salon });
    return res.status(SUCCESS).json({ data: bookings });
  } catch (error) {
    console.log("error in listBookings controller", error);
    next(error);
  }
};
