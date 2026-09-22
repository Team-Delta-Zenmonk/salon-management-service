const { error } = require("../libs");
const { generateResetToken } = require("../libs/generate-token");
const { salonRepository, customerRepository } = require("../repository");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mailService = require("./mail.service");
const { buildForgotPasswordEmailHtml, buildResetPasswordEmailHtml } = require("../templates");
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

  const accessToken = jwt.sign(
    { email: salon.email, uuid: salon.uuid, type: "salon" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { email: salon.email, uuid: salon.uuid, type: "salon" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
    { expiresIn: "7d" }
  );

  return { token: accessToken, refreshToken, salon };
};

exports.refreshSalonToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new error.Unauthorized("Refresh token required");
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh"
    );
    if (decoded.type !== "salon") {
      throw new error.Forbidden("Invalid token type");
    }
    const salon = await salonRepository.findOne({ uuid: decoded.uuid });
    if (!salon) {
      throw new error.BadRequest("Salon not found");
    }
    const accessToken = jwt.sign(
      { email: salon.email, uuid: salon.uuid, type: "salon" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    return { token: accessToken };
  } catch (err) {
    throw new error.Forbidden("Invalid or expired refresh token");
  }
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

  const jwtToken = jwt.sign(
    { email: customer.email, uuid: customer.uuid, role: "customer", type: "customer" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { email: customer.email, uuid: customer.uuid, role: "customer", type: "customer" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
    { expiresIn: "7d" }
  );

  return { token: jwtToken, refreshToken, customer };
};

exports.refreshCustomerToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new error.Unauthorized("Refresh token required");
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh"
    );
    if (decoded.type !== "customer") {
      throw new error.Forbidden("Invalid token type");
    }
    const customer = await customerRepository.findOne({ uuid: decoded.uuid });
    if (!customer) {
      throw new error.BadRequest("Customer not found");
    }
    const jwtToken = jwt.sign(
      { email: customer.email, uuid: customer.uuid, role: "customer", type: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    return { token: jwtToken };
  } catch (err) {
    throw new error.Forbidden("Invalid or expired refresh token");
  }
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

  const resetUrl = `${process.env.FRONTEND_URL || "https://salon.com"}/reset-password/${token}`;

  const html = buildForgotPasswordEmailHtml({
    userName: salon.name || "Valued Partner",
    resetLink: resetUrl,
    expiryMinutes: 15,
    salonName: salon.name || "SALON",
  });

  await mailService.sendMailToUser(
    email,
    "Reset Your Password",
    `Click here to reset your password: ${resetUrl}. This link will expire in 15 minutes.`,
    html
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

  const changedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = buildResetPasswordEmailHtml({
    userName: salon.name || "Valued Partner",
    changedAt,
    loginUrl: `${process.env.FRONTEND_URL || "https://salon.com"}/login`,
    salonName: salon.name || "SALON",
  });

  try {
    await mailService.sendMailToUser(
      salon.email,
      "Password Reset Successful",
      `Your password for ${salon.name || "your account"} was successfully reset on ${changedAt}.`,
      html
    );
  } catch (mailErr) {
    console.warn("Could not send password reset confirmation email:", mailErr.message);
  }

  return "Password reset successfully";
};
