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

function parseNumber(value, defaultValue) {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    if (value.includes("*")) {
      const parts = value.split("*").map((p) => Number(p.trim()));
      if (parts.every((p) => !isNaN(p))) {
        return parts.reduce((acc, curr) => acc * curr, 1);
      }
    }
    const num = Number(value.trim());
    if (!isNaN(num) && num > 0) return num;
  }
  return defaultValue;
}

exports.rateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 5,
  message = "Too many requests from this IP, please try again later.",
} = {}) => {
  const numericWindowMs = parseNumber(windowMs, 15 * 60 * 1000);
  const numericMax = parseNumber(max, 5);

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
    windowMs: numericWindowMs,
    max: numericMax,
    standardHeaders: true, // Return standard RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    store,
    message: { error: message },
  });
};
