const nodemailer = require("nodemailer");
const { mailConfig } = require("../config");

const transporter = nodemailer.createTransport(mailConfig);

exports.sendMailToUser = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail", error);
    throw error;
  }
};

exports.sendInvoiceMail = async ({ to, subject, html, pdfBuffer, filename }) => {
  const mailOptions = {
    from: process.env.MAIL_USER || `"salon.com" <no-reply@salon.com>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: filename || "Invoice.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    if (process.env.NODE_ENV !== "test") {
      await transporter.sendMail(mailOptions);
      console.log(`Invoice email sent successfully to ${to}`);
    }
  } catch (error) {
    console.log("Error sending invoice email:", error);
    throw error;
  }
};
