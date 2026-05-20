const { CREATED, SUCCESS } = require("../libs/constants");
const { inventoryItemService } = require('../services');

exports.createInventoryItem = async (req, res, next) => {
  try {
    const response = await inventoryItemService.createInventoryItem({
      body: req.body,
      salon: req.salon
    });
    return res.status(CREATED).json(response);
  } catch (error) {
    console.log("Error in controller createInventoryItem", error);
    return next(error);
  }
};

exports.listInventoryItems = async (req, res, next) => {
  try {
    const response = await inventoryItemService.listInventoryItems({
      salon: req.salon,
      query: req.query
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller listInventoryItems", error);
    return next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const response = await inventoryItemService.updateInventoryItem({
      body: req.body,
      salon: req.salon,
      params: req.params
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller updateInventoryItem", error);
    return next(error);
  }
};

exports.getInventoryItem = async (req, res, next) => {
  try {
    const response = await inventoryItemService.getInventoryItem({
      salon: req.salon,
      params: req.params
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller getInventoryItem", error);
    return next(error);
  }
};