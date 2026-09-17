const JWT = require("jsonwebtoken");
const {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
  BAD_REQUEST,
} = require("../libs/constants");
const {
  salonRepository,
  customerRepository,
  adminUserRepository,
} = require("../repository");

const extractToken = (req, cookieName) => {
  const rawToken = req.headers.authorization || req?.cookies?.[cookieName];
  if (!rawToken) return null;
  return rawToken.startsWith("Bearer ")
    ? rawToken.slice(7).trim()
    : rawToken.trim();
};

exports.authSalonMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req, "salon_jwt");

    if (!token) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Unauthorized - Token not provided" });
    }

    JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(FORBIDDEN)
          .json({ error: "Forbidden - Invalid token" });
      }

      const { uuid } = decoded;
      const salon = await salonRepository.findOne({ uuid });

      if (!salon) {
        return res.status(BAD_REQUEST).json({ error: "Salon not found" });
      }

      req.salon = salon;
      next();
    });
  } catch (err) {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).json({
      message: "Authentication Error",
      error: err.message,
    });
  }
};

exports.authCustomerMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req, "customer_jwt");

    if (!token) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Unauthorized - Token not provided" });
    }

    JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(FORBIDDEN)
          .json({ error: "Forbidden - Invalid token" });
      }

      const { uuid } = decoded;
      const customer = await customerRepository.findOne({ uuid });

      if (!customer) {
        return res.status(BAD_REQUEST).json({ error: "Customer not found" });
      }

      req.user = customer;
      next();
    });
  } catch (err) {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).json({
      message: "Authentication Error",
      error: err.message,
    });
  }
};

exports.authAdminMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req, "admin_jwt");

    if (!token) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Unauthorized - Admin token not provided" });
    }

    JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(FORBIDDEN)
          .json({ error: "Forbidden - Invalid admin token" });
      }

      const { uuid, role } = decoded;
      if (role !== "super_admin" && role !== "support" && role !== "admin") {
        return res
          .status(FORBIDDEN)
          .json({ error: "Forbidden - Insufficient privileges" });
      }

      const adminUser = await adminUserRepository.findOne({
        uuid,
        is_active: true,
      });

      if (!adminUser) {
        return res
          .status(FORBIDDEN)
          .json({ error: "Admin user not found or inactive" });
      }

      req.admin = adminUser;
      next();
    });
  } catch (err) {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).json({
      message: "Admin Authentication Error",
      error: err.message,
    });
  }
};

exports.optionalAuthSalonMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req, "salon_jwt");
    if (!token) return next();

    JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err && decoded?.uuid) {
        try {
          const salon = await salonRepository.findOne({ uuid: decoded.uuid });
          if (salon) req.salon = salon;
        } catch (_) {}
      }
      return next();
    });
  } catch (err) {
    return next();
  }
};
