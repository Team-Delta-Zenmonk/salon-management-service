const { adminUserRepository } = require("../repository");
const { sendMailToUser } = require("./mail.service");
const { BadRequest } = require("../libs/error");
const { buildLeadEmailHtml } = require("../templates");

exports.submitLead = async (payload) => {
  const { name, email, phone, salonName, city, message } = payload.body || {};

  if (!name || (!email && !phone)) {
    throw new BadRequest("Name and at least email or phone number are required.");
  }

  let recipientEmails = [];
  try {
    const admins = await adminUserRepository.findAll({ criteria: { is_active: true } });
    if (admins && admins.length > 0) {
      recipientEmails = admins.map((admin) => admin.email).filter(Boolean);
    }
  } catch (err) {
    console.error("Error fetching admin emails for lead notification:", err);
  }

  if (recipientEmails.length === 0) {
    const fallbackEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.MAIL_USER || "admin@salon.com";
    recipientEmails.push(fallbackEmail);
  }

  const subject = `New Lead Submission: ${name}${salonName ? ` (${salonName})` : ""}`;

  const htmlContent = buildLeadEmailHtml({
    name,
    email,
    phone,
    salonName,
    city,
    message,
  });

  for (const recipient of recipientEmails) {
    try {
      await sendMailToUser(recipient, subject, "", htmlContent);
    } catch (error) {
      console.error(`Failed to send lead email to ${recipient}:`, error);
    }
  }

  return {
    message: "Lead submitted successfully. Our team will get in touch shortly.",
  };
};
