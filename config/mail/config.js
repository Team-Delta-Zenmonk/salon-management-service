require("dotenv").config();

const port = Number(process.env.MAIL_PORT) || 587;

module.exports = {
  service: process.env.MAIL_SERVICE,
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
};
