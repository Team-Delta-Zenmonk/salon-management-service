const { salonService } = require("../services");

exports.onBoardSalon = async (req, res, next) => {
    try {
        const message = await salonService.onBoardSalon({ body: req.body });
        return res.status(200).json({ message });
    } catch (error) {
        console.log("Error in controller onBoardSalon", error);
        return next(error);
    }
}
