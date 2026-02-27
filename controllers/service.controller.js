const { CREATED, SUCCESS } = require("../libs/constants");
const { serviceService } = require("../services");

exports.createService = async (req, res, next) => {
    try {
        const response = await serviceService.createService({ body: req.body, salon: req.salon });
        return res.status(CREATED).json(response);
    } catch (error) {
        console.log("Error in createService controller", error);
        return next(error);
    }
}

exports.listServices = async (req, res, next) => {
    try {
        const response = await serviceService.listServices({ query: req.query, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in listServices controller", error);
        return next(error);
    }
}

exports.listStaff = async(req, res, next) => {
    try {
        const response = await serviceService.listStaff({ params: req.params, query: req.query });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in list staff for a service controller", error);
        return next(error);
    }
}

exports.listSubServices = async (req, res, next) => {
    try {
        const response = await serviceService.listSubServices({ params: req.params, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in listSubServices controller", error);
        return next(error);
    }
}

exports.getService = async (req, res, next) => {
    try {
        const response = await serviceService.getService({ params: req.params, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in getService controller", error);
        return next(error);
    }
}

exports.updateService = async (req, res, next) => {
    try {
        const response = await serviceService.updateService({ body: req.body, params: req.params, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in updateService controller", error);
        return next(error);
    }
}

exports.deleteService = async (req, res, next) => {
    try {
        const response = await serviceService.deleteService({ params: req.params, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in deleteService controller", error);
        return next(error);
    }
}

