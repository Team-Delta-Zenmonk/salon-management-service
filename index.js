require("dotenv").config();
global.argv = process.argv.slice(2);
global.port = global.argv[0] || process.env.APP_PORT || 8080;
const stripeRouter = require("./routes/stripe.router");

require("./jobs");

if (!global.port) {
  console.log("port is not defined. argv = ", global.argv);
  process.exit(128);
}

const express = require("express");
const cors = require("cors");
const { errorMiddleware } = require("./middlewares");
const { checkConnection } = require("./config/").dbConnection;
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((url) => url.trim()) : [];
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    credentials: true,
  }),
);

app.use("/stripe", stripeRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    .then(() => {
      app.listen(global.port, () => {
        const NODE_ENV = process.env.NODE_ENV;
        console.log(`${NODE_ENV} Server is listening on port ${global.port}`);
      });
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
      console.error("Cancelling app server launch");
    });
}

module.exports = app;
