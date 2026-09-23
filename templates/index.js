require("../libs/jsx-loader");
const EmailTemplate =
  require("./email.jsx").default || require("./email.jsx").EmailTemplate;
const { EmailType } = require("./email.types");
const {
  buildEmailHtml,
  buildForgotPasswordEmailHtml,
  buildOtpVerificationEmailHtml,
  buildSalonLiveEmailHtml,
  buildResetPasswordEmailHtml,
  buildInvoiceEmailHtml,
} = require("./email.builder.jsx");
const { Header } = require("./header.jsx");
const { Footer } = require("./footer.jsx");

module.exports = {
  Header,
  Footer,
  EmailType,
  EmailTemplate,
  buildEmailHtml,
  buildForgotPasswordEmailHtml,
  buildOtpVerificationEmailHtml,
  buildSalonLiveEmailHtml,
  buildResetPasswordEmailHtml,
  buildInvoiceEmailHtml,
};
