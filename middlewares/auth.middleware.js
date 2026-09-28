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

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const TWO_HOURS_IN_SECONDS = 2 * 60 * 60; // 7200 seconds (2 hours)
const ACCESS_TOKEN_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in ms

const extractToken = (req, cookieName) => {
  const rawToken = req.headers.authorization || req?.cookies?.[cookieName];
  if (!rawToken) return null;
  return rawToken.startsWith("Bearer ")
    ? rawToken.slice(7).trim()
    : rawToken.trim();
};

const checkAndRefreshToken = (res, decoded, tokenPayload, cookieName) => {
  if (!decoded || !decoded.exp) return;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - nowInSeconds;

  if (timeUntilExpiry > 0 && timeUntilExpiry < TWO_HOURS_IN_SECONDS) {
    try {
      const newToken = JWT.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "2d",
      });
      res.cookie(cookieName, newToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      });
      res.setHeader("x-refreshed-access-token", newToken);
    } catch (err) {
      console.warn("Error refreshing token in middleware:", err.message);
    }
  }
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

      checkAndRefreshToken(
        res,
        decoded,
        { email: salon.email, uuid: salon.uuid, type: "salon" },
        "salon_jwt",
      );

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

      checkAndRefreshToken(
        res,
        decoded,
        { email: customer.email, uuid: customer.uuid, role: "customer", type: "customer" },
        "customer_jwt",
      );

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

      checkAndRefreshToken(
        res,
        decoded,
        { email: adminUser.email, uuid: adminUser.uuid, role: adminUser.role, type: "admin" },
        "admin_jwt",
      );

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
          if (salon) {
            checkAndRefreshToken(
              res,
              decoded,
              { email: salon.email, uuid: salon.uuid, type: "salon" },
              "salon_jwt",
            );
            req.salon = salon;
          }
        } catch (_) {}
      }
      return next();
    });
  } catch (err) {
    return next();
  }
};
