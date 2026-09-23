module.exports = {
  errorMiddleware: require("./error.middleware"),
  authMiddleware: require("./auth.middleware"),
  uploadMiddleware: require("./upload.middleware"),
  subscriptionMiddleware: require("./subscription.middleware"),
  rateLimitMiddleware: require("./rate-limit.middleware"),
};
