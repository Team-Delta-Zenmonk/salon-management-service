require("../libs/jsx-loader");
const { buildEmailHtml, EmailTemplate, EmailType } = require("./email.jsx");

module.exports = {
  EmailType,
  EmailTemplate,
  buildEmailHtml,
  buildForgotPasswordEmailHtml: (props) =>
    buildEmailHtml({ ...props, type: EmailType.FORGOT_PASSWORD }),
  buildOtpVerificationEmailHtml: (props) =>
    buildEmailHtml({ ...props, type: EmailType.OTP_VERIFICATION }),
  buildSalonLiveEmailHtml: (props) =>
    buildEmailHtml({ ...props, type: EmailType.SALON_LIVE }),
  buildResetPasswordEmailHtml: (props) =>
    buildEmailHtml({ ...props, type: EmailType.RESET_PASSWORD }),
  buildInvoiceEmailHtml: (props) =>
    buildEmailHtml({ ...props, type: EmailType.INVOICE }),
};
