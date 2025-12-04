const { CREATED, SUCCESS } = require("../libs/constants")
const { categoryService } = require("../services")

exports.createCategory = async (req, res, next) => {
    try {
        const message = await categoryService.createCategory({ body: req.body, salon: req.salon })
        return res.status(CREATED).json({ message })

    } catch (error) {
        console.log("Error in controller createCategory", error)
        return next(error)
    }
}

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getCategories({ salon: req.salon })
        return res.status(SUCCESS).json({ categories })
    } catch (error) {
        console.log("Error in controller getCategories", error)
        return next(error)
    }
}

exports.updateCategory = async (req, res, next) => {
    try {
        const message = await categoryService.updateCategory({ body: req.body, salon: req.salon, params: req.params })
        return res.status(SUCCESS).json({ message })
    } catch (error) {
        console.log("Error in controller updateCategory", error)
        return next(error)
    }
}

exports.deleteCategory = async (req, res, next) => {
    try {
        const message = await categoryService.deleteCategory({ salon: req.salon, params: req.params })
        return res.status(SUCCESS).json({ message })
    } catch (error) {
        console.log("Error in controller deleteCategory", error)
        return next(error)
    }
}

