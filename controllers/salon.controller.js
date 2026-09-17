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

exports.checkSlugAvailability = async (req, res, next) => {
  try {
    const result = await salonService.checkSlugAvailability({
      params: req.params,
      salon: req.salon,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.log("Error in controller checkSlugAvailability", error);
    return next(error);
  }
};

exports.upgradeSubscription = async (req, res, next) => {
  try {
    const result = await salonService.upgradeSubscription({
      body: req.body,
      salon: req.salon,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.log("Error in controller upgradeSubscription", error);
    return next(error);
  }
};

exports.getSubscriptionInvoices = async (req, res, next) => {
  try {
    const result = await salonService.getSubscriptionInvoices({
      salon: req.salon,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.log("Error in controller getSubscriptionInvoices", error);
    return next(error);
  }
};

exports.createSubscriptionPaymentIntent = async (req, res, next) => {
  try {
    const result = await salonService.createSubscriptionPaymentIntent({
      body: req.body,
      salon: req.salon,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.log("Error in controller createSubscriptionPaymentIntent", error);
    return next(error);
  }
};




