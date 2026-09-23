const { SUCCESS } = require("../libs/constants");
const { publicService } = require("../services");

exports.submitLead = async (req, res, next) => {
  try {
    const response = await publicService.submitLead({ body: req.body });
    return res.status(SUCCESS).json(response);
  } catch (error) {
    console.log("Error in publicController submitLead:", error);
    return next(error);
  }
};
