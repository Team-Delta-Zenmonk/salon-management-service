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