const { CREATED, SUCCESS } = require("../libs/constants")
const { categoryService } = require("../services")

exports.createCategory = async (req, res, next) => {
    try {
        const response = await categoryService.createCategory({ body: req.body, salon: req.salon })
        return res.status(CREATED).json(response)

    } catch (error) {
        console.log("Error in controller createCategory", error)
        return next(error)
    }
}

exports.listCategories = async (req, res, next) => {
    try {
        const response = await categoryService.listCategories({ salon: req.salon })
        return res.status(SUCCESS).json(response)
    } catch (error) {
        console.log("Error in controller listCategories", error)
        return next(error)
    }
}

exports.updateCategory = async (req, res, next) => {
    try {
        const response = await categoryService.updateCategory({ body: req.body, salon: req.salon, params: req.params })
        return res.status(SUCCESS).json(response)
    } catch (error) {
        console.log("Error in controller updateCategory", error)
        return next(error)
    }
}

exports.deleteCategory = async (req, res, next) => {
    try {
        const response = await categoryService.deleteCategory({ salon: req.salon, params: req.params })
        return res.status(SUCCESS).json(response)
    } catch (error) {
        console.log("Error in controller deleteCategory", error)
        return next(error)
    }
}

exports.getCategory = async (req, res, next) => {
    try {
        const response = await categoryService.getCategory({ salon: req.salon, params: req.params })
        return res.status(SUCCESS).json(response)
    } catch (error) {
        console.log("Error in controller getCategory", error)
        return next(error)
    }
}
