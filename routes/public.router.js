const router = require("express").Router();
const { publicController } = require("../controllers");
const { rateLimitMiddleware } = require("../middlewares");

const leadLimiter = rateLimitMiddleware.rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 lead submissions per 15 mins
  message: "Too many lead submissions from this IP. Please try again after 15 minutes.",
});

router.post("/leads", leadLimiter, publicController.submitLead);

module.exports = router;
