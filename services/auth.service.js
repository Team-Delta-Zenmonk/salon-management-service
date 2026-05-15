const { error } = require("../libs");
const { generateResetToken } = require("../libs/generate-token");
const { salonRepository, customerRepository } = require("../repository");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mailService = require("./mail.service");
const { hashPassword, comparePassword } = require("../libs/hash");
const admin = require("../config/firebase");

exports.loginSalon = async (payload) => {
  const { email, password } = payload.body;

  const salon = await salonRepository.findByEmailReturnWithPassword(email);

  if (!salon) {
    throw new error.BadRequest("Salon not found");
  }

  const isPasswordValid = await comparePassword(password, salon.password);

  if (!isPasswordValid) {
    throw new error.BadRequest("Invalid password");
  }

  const token = jwt.sign({ email: salon.email, uuid: salon.uuid }, process.env.JWT_SECRET);
  return { token, salon };
};

exports.loginCustomer = async (payload) => {
  const { token } = payload.body;

  const decodedToken = await admin.auth().verifyIdToken(token);
  const { email, uid, name, picture, phone_number } = decodedToken;

  let customer = await customerRepository.findOne({ email });

  if (!customer) {
    customer = await customerRepository.create({
      email,
      name: name,
      phone_number: phone_number || null,
    });
  }

  const jwtToken = jwt.sign({ email: customer.email, uuid: customer.uuid, role: "customer" }, process.env.JWT_SECRET);
  return { token: jwtToken, customer };
};

exports.forgotPassword = async (payload) => {
  const { email } = payload.body;

  const salon = await salonRepository.findOne({ email });

  if (!salon) {
    throw new error.BadRequest("Salon not found");
  }
  const { token, hashed } = generateResetToken();

  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await salonRepository.update({
    payload: { reset_password_token: hashed, reset_token_expiry: expiry },
    criteria: { email },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await mailService.sendMailToUser(
    email,
    "Reset your password",
    `Click here to reset your password: ${resetUrl}. This link will expire in 15 minutes.`,
  );

  return "Password reset link sent to your email";
};

exports.resetPassword = async (payload) => {
  const { token, password } = payload.body;

  if (!token || !password) {
    throw new error.BadRequest("Token and password required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const salon = await salonRepository.findOne({ reset_password_token: hashedToken });

  if (!salon) {
    throw new error.BadRequest("Invalid token");
  }

  if (salon.reset_token_expiry < new Date()) {
    throw new error.BadRequest("Token expired");
  }

  const hashedPassword = await hashPassword(password);

  await salonRepository.update({
    payload: { password: hashedPassword, reset_password_token: null, reset_token_expiry: null },
    criteria: { id: salon.id },
  });

  return "Password reset successfully";
};
