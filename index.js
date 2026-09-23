require("dotenv").config();
global.argv = process.argv.slice(2);
global.port = global.argv[0] || process.env.APP_PORT || 8080;
const stripeRouter = require("./routes/stripe.router");

if (!global.port) {
  console.log("port is not defined. argv = ", global.argv);
  process.exit(128);
}

const path = require("path");
const express = require("express");
const cors = require("cors");
const { errorMiddleware } = require("./middlewares");
const { checkConnection } = require("./config/").dbConnection;
const cookieParser = require("cookie-parser");
const { initPresets } = require("./config");
const socketManager = require("./libs/socket.manager");

const app = express();

app.use(cookieParser());

const rawClientUrls = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : [];
const allowedOrigins = rawClientUrls
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");

  if (allowedOrigins.includes(cleanOrigin)) return true;

  if (
    cleanOrigin.endsWith(".vercel.app") ||
    cleanOrigin.endsWith(".trycloudflare.com") ||
    cleanOrigin.includes("localhost") ||
    cleanOrigin.includes("127.0.0.1")
  ) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.log("Not allowed by CORS: ", origin);
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "stripe-signature",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
  }),
);

app.use("/stripe", stripeRouter);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "templates/static")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", require("./routes"));
app.use("/", require("./routes"));

app.use((req, res, next) => {
  res.status(404).json({ error: "Resource not found" });
});

app.use(errorMiddleware);

process.on("uncaughtException", (err) => {
  console.log("uncaught exception", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("unhandled rejection", reason);
});

if (process.env.NODE_ENV !== "test") {
  checkConnection()
    .then(async () => {
      await initPresets();
      const server = app.listen(global.port, () => {
        const NODE_ENV = process.env.NODE_ENV;
        console.log(`${NODE_ENV} Server is listening on port ${global.port}`);
      });
      socketManager.init(server);
      require("./jobs");
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
      console.error("Cancelling app server launch");
    });
}

module.exports = app;
