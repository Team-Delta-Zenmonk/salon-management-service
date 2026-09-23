const { adminUserRepository } = require("../repository");
const { sendMailToUser } = require("./mail.service");
const { BadRequest } = require("../libs/error");

exports.submitLead = async (payload) => {
  const { name, email, phone, salonName, city, message } = payload.body || {};

  if (!name || (!email && !phone)) {
    throw new BadRequest("Name and at least email or phone number are required.");
  }

  // Retrieve active Super Admin emails or fallback to env/default email
  let recipientEmails = [];
  try {
    const admins = await adminUserRepository.find({ is_active: true });
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
  
  const textContent = `
New Lead Details Submitted by Customer:

Name: ${name}
Email: ${email || "N/A"}
Phone: ${phone || "N/A"}
Salon Name: ${salonName || "N/A"}
City: ${city || "N/A"}
Message: ${message || "N/A"}
Submitted At: ${new Date().toISOString()}
  `.trim();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; rounded: 8px;">
      <h2 style="color: #d946ef; margin-top: 0;">New Lead Submitted</h2>
      <p style="font-size: 14px; color: #666;">A new lead has been submitted through the public portal:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; width: 35%; border: 1px solid #ddd;">Name:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Email:</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email || "N/A"}</a></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Phone:</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${phone}">${phone || "N/A"}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Salon Name:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${salonName || "N/A"}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">City:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${city || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Message:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${message ? message.replace(/\n/g, "<br/>") : "N/A"}</td>
        </tr>
      </table>

      <p style="font-size: 12px; color: #888; margin-top: 20px; text-align: center;">
        Sent automatically by Salon Management Platform Public Lead API.
      </p>
    </div>
  `;

  // Send mail to all admin recipients
  for (const recipient of recipientEmails) {
    try {
      await sendMailToUser(recipient, subject, textContent, htmlContent);
    } catch (error) {
      console.error(`Failed to send lead email to ${recipient}:`, error);
    }
  }

  return {
    message: "Lead submitted successfully. Our team will get in touch shortly.",
  };
};
