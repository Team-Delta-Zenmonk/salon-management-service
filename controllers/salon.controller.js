const { SUCCESS } = require("../libs/constants");
const { salonService } = require("../services");

exports.updateSalon = async (req, res, next) => {
  try {
    const message = await salonService.updateSalon({ body: req.body, salon: req.salon });
    return res.status(SUCCESS).json({ message });
  } catch (error) {
    console.log("Error in controller updateSalon", error);
    return next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const message = await salonService.getAvailableSlots({ query: req.query });
    return res.status(SUCCESS).json({ message });
  } catch (error) {
    console.log("Error in controller getAvailableSlots", error);
    return next(error);
  }
};

exports.listSalons = async (req, res, next) => {
  try {
    const message = await salonService.listSalons({ query: req.query });
    return res.status(SUCCESS).json(message);
  } catch (error) {
    console.log("Error in controller listSalons", error);
    return next(error);
  }
};

exports.getSalon = async (req, res, next) => {
  try {
    const message = await salonService.getSalon({ params: req.params });

    return res.status(SUCCESS).json(message);
  } catch (error) {
    console.log("Error in controller getSalon", error);
    return next(error);
  }
};
