const { CREATED, SUCCESS } = require("../libs/constants");
const { inventoryTransactionService } = require("../services");

exports.createTransaction = async (req, res, next) => {
  try {
    const response = await inventoryTransactionService.createTransaction({
      body: req.body,
      salon: req.salon,
    });
    return res.status(CREATED).json(response);
  } catch (error) {
    console.log("Error in controller createTransaction", error);
    return next(error);
  }
};

exports.listTransactions = async (req, res, next) => {
  try {
    const response = await inventoryTransactionService.listTransactions({
      salon: req.salon,
      query: req.query,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller listTransactions", error);
    return next(error);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const response = await inventoryTransactionService.getTransaction({
      salon: req.salon,
      params: req.params,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller getTransaction", error);
    return next(error);
  }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const response = await inventoryTransactionService.updateTransaction({
      body: req.body,
      salon: req.salon,
      params: req.params,
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller updateTransaction", error);
    return next(error);
  }
};
