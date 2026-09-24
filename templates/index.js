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
  buildLeadEmailHtml,
} = require("./email.builder.jsx");
const { Header, Footer } = require("./components");


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
  buildLeadEmailHtml,
};
