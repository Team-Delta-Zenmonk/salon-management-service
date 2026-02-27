const JWT = require("jsonwebtoken");
const { FORBIDDEN, INTERNAL_SERVER_ERROR, UNAUTHORIZED, BAD_REQUEST } = require("../libs/constants");
const { salonRepository } = require("../repository");

exports.authSalonMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization || req?.cookies?.jwt;

        if (!token) {
            return res.status(UNAUTHORIZED).json({ error: 'Unauthorized - Token not provided' });
        }

        JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(FORBIDDEN).json({ error: 'Forbidden - Invalid token' });
            }

            const { uuid } = decoded;

            const salon = await salonRepository.findOne({ uuid });

            if (!salon) {
                return res.status(BAD_REQUEST).json({ error: "Salon not found" });
            }

            req.salon = salon;

            next();
        });
    }
    catch (err) {
        console.error(err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Authentication Error",
            error: err.message,
        });
    }
};

exports.authCustomerMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization || req?.cookies?.jwt;

        if (!token) {
            return res.status(UNAUTHORIZED).json({ error: 'Unauthorized - Token not provided' });
        }

        JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(FORBIDDEN).json({ error: 'Forbidden - Invalid token' });
            }

            const { uuid } = decoded;

            // Use customerRepository
            const { customerRepository } = require("../repository");
            const customer = await customerRepository.findOne({ uuid });

            if (!customer) {
                return res.status(BAD_REQUEST).json({ error: "Customer not found" });
            }

            req.user = customer;

            next();
        });
    }
    catch (err) {
        console.error(err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Authentication Error",
            error: err.message,
        });
    }
};
