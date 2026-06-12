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
    const booking = await bookingService.createAdminBooking({ body: req.body, salon: req.salon });
    return res.status(CREATED).json({ message: "Booking created successfully", data: booking });
  } catch (error) {
    console.log("error in createAdminBooking controller", error);
    next(error);
  }
};

exports.updateAdminBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.updateAdminBooking({
      params: req.params,
      body: req.body,
      salon: req.salon,
    });
    return res.status(SUCCESS).json({ message: "Booking updated successfully", data: booking });
  } catch (error) {
    console.log("error in updateAdminBooking controller", error);
    next(error);
  }
};

exports.deleteAdminBooking = async (req, res, next) => {
  try {
    await bookingService.deleteAdminBooking({
      params: req.params,
      salon: req.salon,
    });
    return res.status(SUCCESS).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.log("error in deleteAdminBooking controller", error);
    next(error);
  }
};

exports.listBookings = async (req, res, next) => {
  try {
    const result = await bookingService.listBookings({ query: req.query, salon: req.salon });
    return res.status(SUCCESS).json({ data: result.bookings, pagination: result.pagination });
  } catch (error) {
    console.log("error in listBookings controller", error);
    next(error);
  }
};

exports.listCustomerBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.listCustomerBookings({ query: req.query, customer: req.user });
    return res.status(SUCCESS).json({ data: bookings });
  } catch (error) {
    console.log("error in listCustomerBookings controller", error);
    next(error);
  }
};

exports.getActiveBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getActiveBooking({
      customer: req.user,
      query: req.query,
    });
    return res.status(SUCCESS).json({ data: booking });
  } catch (error) {
    console.log("error in getActiveBooking controller", error);
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    await bookingService.cancelBooking({
      params: req.params,
      customer: req.user,
    });

    return res.status(SUCCESS).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.log("error in cancelBooking controller", error);
    next(error);
  }
};

exports.getBookingByUuid = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingByUuid({
      uuid: req.params.uuid,
      customer: req.user,
    });
    return res.status(SUCCESS).json({ data: booking });
  } catch (error) {
    console.log("error in getBookingByUuid controller", error);
    next(error);
  }
};
