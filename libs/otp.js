const crypto = require("crypto");

exports.generateOtp = (length = 6) => {
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }

  return otp;
};

exports.now = () => new Date();

exports.addMinutes = (d, minutes) => new Date(d.getTime() + minutes * 60000);
