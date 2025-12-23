const { CREATED, SUCCESS } = require("../libs/constants");
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

exports.unassignStaffService = async (req, res, next) => {
    try {
        const response = await staffServicesService.unassignStaffService({ params: req.params });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in unassignStaffService controller", error);
        return next(error);
    }
}
