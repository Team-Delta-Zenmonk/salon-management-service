const { CREATED } = require("../libs/constants");
const { staffServicesService } = require("../services");

exports.bulkCreate = async (req, res, next) => {
    try {
        const response = await staffServicesService.bulkCreate({ body: req.body });
        return res.status(CREATED).json(response);
    } catch (error) {
        console.log("Error in create staff controller", error);
        return next(error);
    }
}
