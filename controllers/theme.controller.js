const { SUCCESS } = require("../libs/constants");
const { themeService } = require("../services");

exports.getThemes = async (req, res, next) => {
  try {
    const data = await themeService.getThemesForSalon({ salon: req.salon });
    return res.status(SUCCESS).json(data);
  } catch (error) {
    console.error("Error in controller getThemes", error);
    return next(error);
  }
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const data = await themeService.createThemePaymentIntent({
      salon: req.salon,
      body: req.body,
    });
    return res.status(SUCCESS).json(data);
  } catch (error) {
    console.error("Error in controller createPaymentIntent (theme)", error);
    return next(error);
  }
};

exports.activateTheme = async (req, res, next) => {
  try {
    const data = await themeService.activateTheme({
      salon: req.salon,
      body: req.body,
    });
    return res.status(SUCCESS).json(data);
  } catch (error) {
    console.error("Error in controller activateTheme", error);
    return next(error);
  }
};

