const { CREATED, SUCCESS } = require("../libs/constants");
const { itemsCategoryService } = require("../services");

exports.createCategory = async (req, res, next) => {
  try {
    const response = await itemsCategoryService.createCategory({
      body: req.body,
      salon: req.salon
    });
    return res.status(CREATED).json(response);
  } catch (error) {
    console.log("Error in controller createCategory", error);
    return next(error);
  }
};

exports.listCategories = async (req, res, next) => {
  try {
    const response = await itemsCategoryService.listCategories({
      salon: req.salon,
      query: req.query
    });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in controller listCategories", error);
    return next(error);
  }
};