const nodemailer = require('nodemailer');
const { mailConfig } = require('../config');

const transporter = nodemailer.createTransport(mailConfig);

exports.sendMailToUser = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.MAIL_USER,
        to,
        subject,
        text
    };

    try {
        await transporter.verify();
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw error;
    }
}
