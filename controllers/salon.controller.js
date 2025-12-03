const { salonService } = require("../services");

exports.updateSalon = async (req, res, next) => {
    try {
        const message = await salonService.updateSalon({ body: req.body, salon: req.salon });
        return res.status(200).json({ message });
    } catch (error) {
        console.log("Error in controller updateSalon", error);
        return next(error);
    }
}
