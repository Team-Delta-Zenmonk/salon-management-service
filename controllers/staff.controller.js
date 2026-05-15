const { CREATED, SUCCESS } = require("../libs/constants");
const { staffService } = require("../services");

exports.create = async (req, res, next) => {
  try {
    const response = await staffService.create({ body: req.body, salon: req.salon });
    return res.status(CREATED).json(response);
  } catch (error) {
    console.log("Error in create staff controller", error);
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const response = await staffService.update({ body: req.body, salon: req.salon, params: req.params });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in update staff controller", error);
    return next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const response = await staffService.list({ salon: req.salon, query: req.query });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in listing staff controller", error);
    return next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const response = await staffService.get({ query: req.query, params: req.params });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in get staff controller", error);
    return next(error);
  }
};

exports.listServices = async (req, res, next) => {
  try {
    const response = await staffService.listServices({ salon: req.salon, params: req.params });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in list staff services controller", error);
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const response = await staffService.remove({ salon: req.salon, params: req.params });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in remove staff controller", error);
    return next(error);
  }
};
