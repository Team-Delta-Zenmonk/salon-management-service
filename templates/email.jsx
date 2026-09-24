import React from "react";
import { Html } from "@react-email/html";
import { Head } from "@react-email/head";
import { Preview } from "@react-email/preview";
import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
import { Hr } from "@react-email/hr";
import { Button } from "@react-email/button";
import { Link } from "@react-email/link";
import { colors } from "./theme";
import styles from "./email.styles";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

export function EmailTemplate(props) {
  const {
    type = "GENERIC",
    salonName,
    logoUrl,
    userName,
    title,
    previewText,
    message,
    ctaText,
    ctaUrl,
    otpCode,
    expiryMinutes = 10,
    actionType,
    changedAt,
    dashboardUrl,
    ownerName,
    email,
    userEmail,
    footerTitle,
    footerBody,
    salon = {},
    customer = {},
    customerName,
    name,
    phone,
    city,
  } = props;

  const brandName = process.env.BRAND_NAME || "Vellora";
  const platformName = brandName;
  const brandLogo = salon.logo || logoUrl || null;
  const isLead = type === "LEAD";
  const recipientEmail = email || userEmail || customer.email || "vellora@gmail.com";
  const displayName =
    ownerName ||
    (typeof userName === "string" && userName.trim() ? userName : null) ||
    customer.name ||
    customerName ||
    "there";

  const resetLinkUrl = ctaUrl || props.resetLink || props.resetUrl || props.loginUrl || "";
  const salonDashboardUrl =
    dashboardUrl ||
    ctaUrl ||
    `${process.env.MANAGEMENT_APP_URL}/dashboard`;

  const isOtp = type === "OTP_VERIFICATION";
  const isForgotPassword = type === "FORGOT_PASSWORD";
  const isSalonLive = type === "SALON_LIVE";
  const isResetPassword = type === "RESET_PASSWORD";

  const leadFields = [
    { label: "Name", value: name },
    {
      label: "Email",
      value: email,
      render: (val) => (
        <Link href={`mailto:${val}`} style={{ color: colors.LINK_BLUE, textDecoration: "none" }}>
          {val}
        </Link>
      ),
    },
    {
      label: "Phone",
      value: phone,
      render: (val) => (
        <Link href={`tel:${val}`} style={{ color: colors.LINK_BLUE, textDecoration: "none" }}>
          {val}
        </Link>
      ),
    },
    { label: "Salon Name", value: salonName },
    { label: "City", value: city },
    {
      label: "Message",
      value: message,
      render: (val) => (
        <span style={{ whiteSpace: "pre-wrap" }}>{val}</span>
      ),
    },
  ].filter((item) => Boolean(item.value));

  let renderedPreview = previewText;
  if (!renderedPreview) {
    if (isOtp) {
      renderedPreview = `Your verification code is ${otpCode || ""}`;
    } else if (isForgotPassword) {
      renderedPreview = otpCode
        ? `Your password reset code is ${otpCode}`
        : `Reset your password for ${brandName}`;
    } else if (isSalonLive) {
      renderedPreview = `Your salon is officially on ${brandName}!`;
    } else if (isResetPassword) {
      renderedPreview = `Your password for ${brandName} has been reset`;
    } else if (isLead) {
      renderedPreview = `New Lead Submission: ${name || "Customer"}`;
    } else {
      renderedPreview = `${brandName} Notification`;
    }
  }

  let bannerHeading = title;
  if (!bannerHeading) {
    if (isOtp) {
      bannerHeading = actionType === "RESEND_OTP" ? "Resend verification code" : "Verify it’s you";
    } else if (isForgotPassword) {
      bannerHeading = otpCode ? "Verify it’s you" : "Reset your password";
    } else if (isSalonLive) {
      bannerHeading = `Your salon is officially on ${brandName}!`;
    } else if (isResetPassword) {
      bannerHeading = "Password Updated";
    } else if (isLead) {
      bannerHeading = "New Lead Submitted";
    } else {
      bannerHeading = "Notification";
    }
  }

  let resolvedFooterTitle = footerTitle;
  let resolvedFooterBody = footerBody;

  if (!resolvedFooterTitle && !resolvedFooterBody) {
    if (isSalonLive) {
      resolvedFooterTitle = (
        <>
          Need a hand? Email{" "}
          <Link href={`mailto:support@${brandName.toLowerCase()}.com`} style={{ color: colors.PRIMARY_ORANGE, textDecoration: "none" }}>
            support@{brandName.toLowerCase()}.com
          </Link>{" "}
          — our team is happy to help.
        </>
      );
      resolvedFooterBody = `This confirmation was sent to ${recipientEmail} because you registered a salon on ${brandName}.`;
    } else if (isLead) {
      resolvedFooterTitle = `The ${brandName} Team`;
      resolvedFooterBody = `Sent automatically by ${brandName} Public Lead API.`;
    } else {
      resolvedFooterTitle = `The ${brandName} Team`;
      resolvedFooterBody = (
        <>
          This automated security email was sent to{" "}
          <Link href={`mailto:${recipientEmail}`} style={{ color: colors.LINK_BLUE, textDecoration: "none" }}>
            {recipientEmail}
          </Link>
          . Please don’t reply.
        </>
      );
    }
  }

  const formattedOtp =
    typeof otpCode === "string" && otpCode.length === 6
      ? `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`
      : String(otpCode || "");

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
          * {
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}</style>
      </Head>
      <Preview>{renderedPreview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Header
            title={bannerHeading}
            logoUrl={brandLogo}
          />

          <Section style={styles.contentSection}>
            {(isOtp || (isForgotPassword && otpCode)) && (
              <>
                <Text style={styles.greetingText}>
                  Hi {displayName},
                </Text>

                <Text style={styles.bodyParagraph}>
                  {message ||
                    (isForgotPassword
                      ? `Use the verification code below to reset your password for your ${platformName} account.`
                      : `Use the verification code below to finish signing in to your ${platformName} account.`)}
                </Text>

                {/* Light Peach OTP Box */}
                <Section style={styles.otpCard}>
                  <Text style={styles.otpDigits}>
                    {formattedOtp}
                  </Text>
                  <Text style={styles.otpExpiry}>
                    This code expires in {expiryMinutes} minutes.
                  </Text>
                </Section>

                {/* Safety / Ignore Notice */}
                <Text style={styles.secondaryParagraph}>
                  If you didn’t request this code, you can safely ignore this email. Your account remains secure.
                </Text>
              </>
            )}

            {/* 2. FORGOT PASSWORD (LINK BASED) */}
            {isForgotPassword && !otpCode && (
              <>
                <Text style={styles.greetingText}>
                  Hi {displayName},
                </Text>

                <Text style={styles.bodyParagraph}>
                  We received a request to reset your password for your {platformName} account. Click the button below to proceed.
                </Text>

                {resetLinkUrl && (
                  <Section style={styles.buttonSectionLeft}>
                    <Button href={resetLinkUrl} style={styles.primaryButton}>
                      {ctaText || "Reset Password"}
                    </Button>
                  </Section>
                )}

                <Text style={styles.secondaryParagraph}>
                  This link will expire in {expiryMinutes} minutes. If you did not request a password reset, you can safely ignore this email.
                </Text>
              </>
            )}

            {/* 3. SALON LIVE / REGISTRATION COMPLETE */}
            {isSalonLive && (
              <>
                {/* Green Pill Badge */}
                <Section style={styles.successBadgeCard}>
                  <table cellPadding="0" cellSpacing="0" border="0">
                    <tr>
                      <td style={styles.badgeIconCell}>
                        <div style={styles.successCheckCircle}>
                          ✓
                        </div>
                      </td>
                      <td style={styles.badgeTextCell}>
                        <span style={styles.successBadgeText}>
                          Salon registration complete
                        </span>
                      </td>
                    </tr>
                  </table>
                </Section>

                <Text style={styles.greetingText}>
                  Hi {displayName},
                </Text>

                <Text style={styles.bodyParagraph}>
                  Great news — <strong style={{ color: colors.DARK_TEXT }}>{salon.name || salonName || "Your salon"}</strong> has been registered successfully. Your salon workspace is ready, and you can now shape the booking experience your clients will see.
                </Text>

                <Section style={styles.buttonSection}>
                  <Button href={salonDashboardUrl} style={styles.primaryButton}>
                    Go to salon dashboard
                  </Button>
                </Section>

                <Text style={styles.secondaryParagraph}>
                  You’re all set to build a polished salon presence and turn interest into bookings. We can’t wait to see {salon.name || salonName || "your salon"} grow.
                </Text>
              </>
            )}

            {/* 4. PASSWORD RESET SUCCESSFUL */}
            {isResetPassword && (
              <>
                <Text style={styles.greetingText}>
                  Hi {displayName},
                </Text>

                <Section style={styles.passwordResetCard}>
                  <Text style={styles.passwordResetTitle}>
                    ✓ Account Security Updated
                  </Text>
                  <Text style={styles.passwordResetText}>
                    Your password was successfully changed{changedAt ? ` on ${changedAt}` : ""}.
                  </Text>
                </Section>

                <Text style={styles.bodyParagraph}>
                  If you performed this change, no further action is needed. If you did not make this request, please contact our support team immediately.
                </Text>

                {ctaUrl && (
                  <Section style={styles.buttonSectionSm}>
                    <Button href={ctaUrl} style={styles.primaryButton}>
                      {ctaText || "Log In to Account"}
                    </Button>
                  </Section>
                )}
              </>
            )}

            {/* 5. LEAD SUBMISSION */}
            {isLead && (
              <>
                <Text style={styles.greetingText}>
                  Hello Admin,
                </Text>

                <Text style={styles.bodyParagraph}>
                  A new lead has been submitted through the public portal:
                </Text>

                {leadFields.length > 0 && (
                  <Section style={styles.leadCard}>
                    <table
                      cellPadding="0"
                      cellSpacing="0"
                      border="0"
                      style={styles.leadTable}
                    >
                      <tbody>
                        {leadFields.map((field, idx) => (
                          <tr
                            key={field.label}
                            style={{
                              backgroundColor:
                                idx % 2 === 0 ? colors.MUTED_BG : colors.WHITE,
                              borderBottom:
                                idx < leadFields.length - 1
                                  ? `1px solid ${colors.BORDER}`
                                  : "none",
                            }}
                          >
                            <td style={styles.leadLabelCell}>
                              {field.label}:
                            </td>
                            <td style={styles.leadValueCell}>
                              {field.render
                                ? field.render(field.value)
                                : field.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Section>
                )}

                <Text style={styles.secondaryParagraph}>
                  Sent automatically by Salon Management Platform Public Lead API.
                </Text>
              </>
            )}

            {/* 6. GENERIC FALLBACK */}
            {type === "GENERIC" && message && (
              <>
                <Text style={styles.greetingText}>
                  Hi {displayName},
                </Text>
                <Text style={styles.bodyParagraph}>
                  {message}
                </Text>
                {ctaUrl && (
                  <Section style={styles.buttonSection}>
                    <Button href={ctaUrl} style={styles.primaryButton}>
                      {ctaText || "Continue"}
                    </Button>
                  </Section>
                )}
              </>
            )}
          </Section>

          {/* Divider */}
          <Hr style={styles.divider} />

          {/* Reusable Footer: 24px vertical, 48px horizontal */}
          <Footer
            footerTitle={resolvedFooterTitle}
            footerBody={resolvedFooterBody}
          />
        </Container>
      </Body>
    </Html>
  );
}

export default EmailTemplate;
