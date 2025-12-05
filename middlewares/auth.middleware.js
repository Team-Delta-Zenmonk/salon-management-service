const JWT = require("jsonwebtoken");
const { FORBIDDEN, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = require("../libs/constants");

exports.authSalonMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization || req?.cookies?.jwt;

        if (!token) {
            return res.status(UNAUTHORIZED).json({ error: 'Unauthorized - Token not provided' });
        }

        JWT.verify(token, process.env.JWT_SECRET, (err, salon) => {
            if (err) {
                return res.status(FORBIDDEN).json({ error: 'Forbidden - Invalid token' });
            }
            req.salon = salon;
            next();
        });
    }
    catch (error) {
        console.log(error)
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Authentication Error",
            error: error.message,
        })
    }
};