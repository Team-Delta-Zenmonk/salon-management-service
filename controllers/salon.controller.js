const { salonServices } = require("../services");

exports.helloSalon1 = async (req, res) => {
    try {
        const message = await salonServices.helloSalon1();
        return res.status(200).json({ message });
    } catch (error) {
        return next(error);
    }
}

exports.helloSalon2 = async (req, res, next) => {
    try {
        const message = await salonServices.helloSalon2();
        return res.status(200).json({ message });
    } catch (error) {
        return next(error);
    }
}