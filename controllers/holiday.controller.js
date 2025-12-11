const { CREATED, SUCCESS } = require("../libs/constants");
const { holidayService } = require("../services");

exports.createHoliday = async (req, res, next) => {
    try {
        const response = await holidayService.createHoliday({ body: req.body, salon: req.salon });
        return res.status(CREATED).json(response);
    } catch (error) {
        console.log("Error in createHoliday controller", error);
        next(error);
    }
}

exports.updateHoliday = async (req, res, next) => {
    try {
        const response = await holidayService.updateHoliday({ params: req.params, body: req.body, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in updateHoliday controller", error);
        next(error);
    }
}

exports.deleteHoliday = async (req, res, next) => {
    try {
        const response = await holidayService.deleteHoliday({ params: req.params, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in deleteHoliday controller", error);
        next(error);
    }
}

exports.listHolidays = async (req, res, next) => {
    try {
        const response = await holidayService.listHolidays({ query: req.query, salon: req.salon });
        return res.status(SUCCESS).json(response);
    } catch (error) {
        console.log("Error in listHolidays controller", error);
        next(error);
    }
}
