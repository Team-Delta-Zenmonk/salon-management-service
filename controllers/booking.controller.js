const { CREATED } = require("../libs/constants");
const { bookingService } = require("../services");

exports.createBooking = async (req, res, next) => {
    try {
        await bookingService.createBooking({ body: req.body });
        return res.status(CREATED).json({ message: "Booking created successfully" });

    } catch (error) {
        console.log("error in createBooking controller", error);
        next(error);
    }
};

exports.listBookings = async (req, res, next) => {
    try {
        const bookings = await bookingService.listBookings({body: req.body, salon : req.salon});
        return res.status(200).json({ data: bookings });
    } catch (error) {
        console.log("error in listBookings controller", error);
        next(error);
    }
}