const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");
const { redisConnection } = require("../config/redis");

let redisClient = null;

try {
  redisClient = new Redis({
    host: redisConnection.host,
    port: redisConnection.port,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });

  redisClient.on("error", () => {
    // Silent catch for Redis disconnection to fallback smoothly
  });
} catch {
  redisClient = null;
}

exports.rateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 5,
  message = "Too many requests from this IP, please try again later.",
} = {}) => {
  const store =
    redisClient && redisClient.status === "ready"
      ? new RedisStore({
          sendCommand: (...args) => redisClient.call(...args),
          prefix: "rl:",
        })
      : undefined; // Default to MemoryStore if Redis is unavailable

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return standard RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    store,
    message: { error: message },
  });
};
