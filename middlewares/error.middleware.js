const { errorHandler } = require("../libs/utils");

module.exports = (err, req, res, next) => {
    console.error(err.message);
    res.status(errorHandler(err)).send(err.message);
}