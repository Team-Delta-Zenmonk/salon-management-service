const { CREATED, SUCCESS } = require("../libs/constants");
const { cartService } = require("../services");

exports.createCart = async (req, res, next) => {
    try {
        const response = await cartService.createCart({ body: req.body, user: req.user, salon: req.salon });
        return res.status(CREATED).json(response);
    } catch (error) {
        console.log("Error in createCart controller", error);
        return next(error);
    }
}

exports.addItem = async (req, res, next) => {
    try {
        const response = await cartService.addItem({ body: req.body, user: req.user, salon: req.salon });
        return res.status(CREATED).json(response);
    } catch (error) {
        console.log("Error in addItem controller", error);
        return next(error);
    }
}

exports.updateItem = async (req, res, next) => {
    try {
        const response = await cartService.updateItem({ body: req.body, params: req.params, user: req.user });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in updateItem controller", error);
        return next(error);
    }
}

exports.removeItem = async (req, res, next) => {
    try {
        const response = await cartService.removeItem({ params: req.params, user: req.user });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in removeItem controller", error);
        return next(error);
    }
}

exports.getCart = async (req, res, next) => {
    try {
        const response = await cartService.getCart({ params: req.params, user: req.user });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in getCart controller", error);
        return next(error);
    }
}

exports.deleteCart = async (req, res, next) => {
    try {
        const response = await cartService.deleteCart({ params: req.params, user: req.user });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in deleteCart controller", error);
        return next(error);
    }
}
