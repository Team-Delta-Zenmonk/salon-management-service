const router = require("express").Router();
const { publicController } = require("../controllers");
const { rateLimitMiddleware } = require("../middlewares");

const leadLimiter = rateLimitMiddleware.rateLimiter({
  windowMs: process.env.MAX_WINDOW_MS,
  max: process.env.MAX_RATE_LIMIT,
  message: "Too many lead submissions from this IP. Please try again after 15 minutes.",
});

router.post("/leads", leadLimiter, publicController.submitLead);

module.exports = router;
