import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailTemplate } from "./email.jsx";
import { EmailType } from "./email.types";

export const buildEmailHtml = (props) => {
  return renderToStaticMarkup(<EmailTemplate {...props} />);
};

export const buildForgotPasswordEmailHtml = (props) =>
  buildEmailHtml({ ...props, type: EmailType.FORGOT_PASSWORD });

export const buildOtpVerificationEmailHtml = (props) =>
  buildEmailHtml({ ...props, type: EmailType.OTP_VERIFICATION });

export const buildSalonLiveEmailHtml = (props) =>
  buildEmailHtml({ ...props, type: EmailType.SALON_LIVE });

export const buildResetPasswordEmailHtml = (props) =>
  buildEmailHtml({ ...props, type: EmailType.RESET_PASSWORD });

export const buildInvoiceEmailHtml = (props) =>
  buildEmailHtml({ ...props, type: EmailType.INVOICE });

export default buildEmailHtml;

