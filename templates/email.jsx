import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
  Button,
  Link,
} from "@react-email/components";
import { colors } from "./email.tokens";
import styles from "./email.styles";
import { Header } from "./header";
import { Footer } from "./footer";

function formatCurrency(amount) {
  if (typeof amount === "string" && amount.startsWith("₹")) return amount;
  const numericVal =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]+/g, ""))
      : amount;
  return `₹${Number(numericVal || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}




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
    invoice = {},
    booking = {},
    salon = {},
    customer = {},
    bookingServices = [],
    customerName,
    invoiceNumber,
    bookingDate,
    totalAmount,
    paymentStatus,
    paymentMethod,
  } = props;

  const brandName = process.env.BRAND_NAME || "Vellora";
  const platformName = brandName;
  const brandLogo = salon.logo || logoUrl || null;
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
    `${process.env.FRONTEND_URL || "https://vellora.com"}/owner/dashboard`;

  const isInvoice = type === "INVOICE";
  const isOtp = type === "OTP_VERIFICATION";
  const isForgotPassword = type === "FORGOT_PASSWORD";
  const isSalonLive = type === "SALON_LIVE";
  const isResetPassword = type === "RESET_PASSWORD";

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
    } else if (isInvoice) {
      renderedPreview = `Payment has been confirmed - Invoice #${invoice.invoice_number || invoiceNumber || "DRAFT"}`;
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
    } else if (isInvoice) {
      bannerHeading = "Payment has been confirmed.";
    } else {
      bannerHeading = "Notification";
    }
  }

  let resolvedFooterTitle = footerTitle;
  let resolvedFooterBody = footerBody;

  if (!resolvedFooterTitle && !resolvedFooterBody) {
    if (isInvoice) {
      const supportEmail = process.env.SUPPORT_EMAIL || `support@${brandName.toLowerCase()}.com`;
      const supportPhone = process.env.SUPPORT_PHONE || salon.phone || salon.phone_number || "(+91) 555-0189";
      resolvedFooterTitle = (
        <>
          Questions about your receipt? Reach out to{" "}
          <Link href={`mailto:${supportEmail}`} style={{ color: "inherit", textDecoration: "none" }}>
            {supportEmail}
          </Link>{" "}
          or call {supportPhone}.
        </>
      );
      resolvedFooterBody = (
        <>
          This automated security email was sent to{" "}
          <Link href={`mailto:${recipientEmail}`} style={{ color: "inherit", textDecoration: "none" }}>
            {recipientEmail}
          </Link>
          . Please do not reply.
        </>
      );
    } else if (isSalonLive) {
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

            {/* 5. INVOICE EMAIL */}
            {isInvoice && (() => {
              const customerNameStr =
                customer.name || customerName || displayName || "Valued Customer";
              const customerFirstName =
                customerNameStr.split(" ")[0] || customerNameStr;

              const rawPaymentMethod = (
                invoice.payment_method ||
                booking.payment_policy ||
                booking.payment_method ||
                paymentMethod ||
                props.paymentMethod ||
                ""
              ).toLowerCase();

              const isPayAtVenue =
                rawPaymentMethod.includes("pay_at_venue") ||
                rawPaymentMethod.includes("venue") ||
                (invoice.payment_status || paymentStatus || "").toLowerCase() === "unpaid";

              const totalAmountVal =
                invoice.grand_total ??
                invoice.total_amount ??
                booking.total_price ??
                totalAmount ??
                0;

              const subtotalAmountVal =
                invoice.subtotal ??
                invoice.sub_total ??
                totalAmountVal;

              const formattedTotal = formatCurrency(totalAmountVal);
              const formattedSubtotal = formatCurrency(subtotalAmountVal);

              const rawInvoiceDate =
                invoice.issued_at || invoice.created_at || booking.booking_date || bookingDate;
              const formattedInvoiceDate = (() => {
                if (!rawInvoiceDate) {
                  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                }
                const d = new Date(rawInvoiceDate);
                return isNaN(d.getTime())
                  ? String(rawInvoiceDate)
                  : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
              })();

              const rawAppointmentTime =
                booking.booking_start_time || booking.start_time || booking.booking_date || bookingDate;
              const formattedAppointmentTime = (() => {
                if (!rawAppointmentTime) return "Thursday, 2:30 PM";
                const d = new Date(rawAppointmentTime);
                if (isNaN(d.getTime())) return String(rawAppointmentTime);
                const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
                const month = d.toLocaleDateString("en-US", { month: "short" });
                const day = d.getDate();
                const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                return `${weekday}, ${month} ${day} · ${time}`;
              })();

              const formattedDuration = (() => {
                const minutes = Number(booking.total_duration || 0);
                if (!minutes) return null;
                const hrs = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (hrs > 0 && mins > 0) return `Duration: ${hrs} hr ${mins} min`;
                if (hrs > 0) return `Duration: ${hrs} hr`;
                return `Duration: ${mins} min`;
              })();

              const customerPhone = customer.phone || customer.phone_number || booking.customer_phone || "";
              const salonAddress = salon.address || "";
              const salonCityState = [salon.city, salon.state, salon.zip_code].filter(Boolean).join(", ");

              const servicesList =
                Array.isArray(bookingServices) && bookingServices.length > 0
                  ? bookingServices
                  : Array.isArray(booking.booking_services) && booking.booking_services.length > 0
                  ? booking.booking_services
                  : [
                      {
                        name: "Signature haircut & style",
                        description: "Consultation, shampoo, and finish.",
                        quantity: 1,
                        price: totalAmountVal,
                      },
                    ];

              return (
                <>
                  {/* Top Status Badge */}
                  <Section
                    style={{
                      backgroundColor: isPayAtVenue ? colors.PEACH_BG : colors.SUCCESS_BG,
                      borderRadius: "6px",
                      padding: "12px 16px",
                      marginBottom: "24px",
                    }}
                  >
                    <table cellPadding="0" cellSpacing="0" border="0">
                      <tr>
                        <td style={{ verticalAlign: "middle", paddingRight: "10px" }}>
                          {isPayAtVenue ? (
                            <span
                              style={{
                                display: "inline-block",
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                backgroundColor: colors.PRIMARY_ORANGE,
                                color: "#FFFFFF",
                                textAlign: "center",
                                lineHeight: "22px",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              !
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                backgroundColor: "#22C55E",
                                color: "#FFFFFF",
                                textAlign: "center",
                                lineHeight: "22px",
                                fontSize: "13px",
                                fontWeight: "bold",
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <Text
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: 700,
                              color: colors.DARK_TEXT,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {isPayAtVenue
                              ? `Unpaid: ${formattedTotal}`
                              : `Successfully paid: ${formattedTotal}.`}
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </Section>

                  {/* Greeting & Subtitle */}
                  <Text style={{ ...styles.greetingText, margin: "0 0 8px 0" }}>
                    Thanks, {customerFirstName}!
                  </Text>
                  <Text style={{ ...styles.bodyParagraph, margin: "0 0 24px 0" }}>
                    Your salon appointment is confirmed.
                  </Text>

                  {/* Metadata: Invoice Number & Date */}
                  <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{ marginBottom: "16px" }}>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>
                        <Text style={{ fontSize: "11px", fontWeight: 700, color: colors.GREYSCALE_500, letterSpacing: "0.5px", margin: "0 0 4px 0", textTransform: "uppercase" }}>
                          INVOICE NUMBER:
                        </Text>
                        <Text style={{ fontSize: "15px", fontWeight: 500, color: colors.DARK_TEXT, margin: 0 }}>
                          {invoice.invoice_number || invoiceNumber || "UB-20481"}
                        </Text>
                      </td>
                      <td style={{ verticalAlign: "top", textAlign: "right" }}>
                        <Text style={{ fontSize: "11px", fontWeight: 700, color: colors.GREYSCALE_500, letterSpacing: "0.5px", margin: "0 0 4px 0", textTransform: "uppercase" }}>
                          INVOICE DATE:
                        </Text>
                        <Text style={{ fontSize: "15px", fontWeight: 500, color: colors.DARK_TEXT, margin: 0 }}>
                          {formattedInvoiceDate}
                        </Text>
                      </td>
                    </tr>
                  </table>

                  <Hr style={{ borderColor: colors.BORDER, margin: "0 0 20px 0" }} />

                  {/* Salon & Customer Details */}
                  <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{ marginBottom: "24px" }}>
                    <tr>
                      <td style={{ width: "50%", verticalAlign: "top", paddingRight: "12px" }}>
                        <Text style={{ fontSize: "11px", fontWeight: 700, color: colors.GREYSCALE_500, letterSpacing: "0.5px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                          SALON:
                        </Text>
                        <Text style={{ fontSize: "14px", fontWeight: 600, color: colors.DARK_TEXT, margin: "0 0 2px 0" }}>
                          {salon.name || salonName || platformName}
                        </Text>
                        {salonAddress && (
                          <Text style={{ fontSize: "13px", color: colors.BODY_TEXT, margin: "0 0 2px 0", lineHeight: "140%" }}>
                            {salonAddress}
                          </Text>
                        )}
                        {salonCityState && (
                          <Text style={{ fontSize: "13px", color: colors.BODY_TEXT, margin: 0, lineHeight: "140%" }}>
                            {salonCityState}
                          </Text>
                        )}
                      </td>
                      <td style={{ width: "50%", verticalAlign: "top", textAlign: "right", paddingLeft: "12px" }}>
                        <Text style={{ fontSize: "11px", fontWeight: 700, color: colors.GREYSCALE_500, letterSpacing: "0.5px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                          CUSTOMER:
                        </Text>
                        <Text style={{ fontSize: "14px", fontWeight: 600, color: colors.DARK_TEXT, margin: "0 0 2px 0" }}>
                          {customerNameStr}
                        </Text>
                        {recipientEmail && (
                          <Text style={{ fontSize: "13px", color: colors.BODY_TEXT, margin: "0 0 2px 0" }}>
                            {recipientEmail}
                          </Text>
                        )}
                        {customerPhone && (
                          <Text style={{ fontSize: "13px", color: colors.BODY_TEXT, margin: 0 }}>
                            {customerPhone}
                          </Text>
                        )}
                      </td>
                    </tr>
                  </table>

                  {/* Services Card / Table */}
                  <Section
                    style={{
                      border: `1px solid ${colors.BORDER}`,
                      borderRadius: "8px",
                      overflow: "hidden",
                      marginBottom: "24px",
                      backgroundColor: colors.WHITE,
                    }}
                  >
                    <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                      <thead>
                        <tr style={{ backgroundColor: colors.PEACH_BG }}>
                          <th style={{ textAlign: "left", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: colors.BODY_TEXT, letterSpacing: "0.5px" }}>SERVICE</th>
                          <th style={{ textAlign: "center", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: colors.BODY_TEXT, letterSpacing: "0.5px" }}>QUANTITY</th>
                          <th style={{ textAlign: "right", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: colors.BODY_TEXT, letterSpacing: "0.5px" }}>PRICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicesList.map((service, idx) => {
                          const sName = service.service?.name || service.name || service.service_name || "Salon Service";
                          const sDesc = service.service?.description || service.description || "";
                          const sQty = service.quantity || 1;
                          const sPrice = service.price || service.rate || 0;

                          return (
                            <tr key={idx}>
                              <td style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.BORDER}`, verticalAlign: "top" }}>
                                <Text style={{ fontSize: "14px", fontWeight: 600, color: colors.DARK_TEXT, margin: "0 0 2px 0" }}>
                                  {sName}
                                </Text>
                                {sDesc && (
                                  <Text style={{ fontSize: "12px", color: colors.GREYSCALE_500, margin: 0 }}>
                                    {sDesc}
                                  </Text>
                                )}
                              </td>
                              <td style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.BORDER}`, textAlign: "center", verticalAlign: "top", fontSize: "14px", color: colors.DARK_TEXT }}>
                                {sQty}
                              </td>
                              <td style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.BORDER}`, textAlign: "right", verticalAlign: "top", fontSize: "14px", fontWeight: 600, color: colors.DARK_TEXT }}>
                                {formatCurrency(sPrice)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Subtotal & Total (excluding sales & service fee as instructed) */}
                    <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{ padding: "16px" }}>
                      <tr>
                        <td style={{ width: "40%" }}></td>
                        <td style={{ width: "60%" }}>
                          <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                            <tr>
                              <td style={{ paddingBottom: "10px", fontSize: "14px", color: colors.BODY_TEXT }}>
                                Subtotal:
                              </td>
                              <td style={{ paddingBottom: "10px", textAlign: "right", fontSize: "14px", fontWeight: 600, color: colors.DARK_TEXT }}>
                                {formattedSubtotal}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ paddingTop: "10px", borderTop: `1px solid ${colors.BORDER}`, fontSize: "16px", fontWeight: 700, color: colors.DARK_TEXT }}>
                                {isPayAtVenue ? "Total due:" : "Total paid:"}
                              </td>
                              <td style={{ paddingTop: "10px", borderTop: `1px solid ${colors.BORDER}`, textAlign: "right", fontSize: "18px", fontWeight: 700, color: isPayAtVenue ? colors.DARK_TEXT : colors.SUCCESS_TEXT }}>
                                {formattedTotal}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </Section>

                  {/* Payment Method & Appointment Cards */}
                  <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{ marginBottom: "20px" }}>
                    <tr>
                      <td style={{ width: "48%", verticalAlign: "top", backgroundColor: colors.PEACH_BG, borderRadius: "8px", padding: "16px" }}>
                        <Text style={{ fontSize: "11px", fontWeight: 700, color: colors.GREYSCALE_500, letterSpacing: "0.5px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                          PAYMENT METHOD:
                        </Text>
                        <Text style={{ fontSize: "15px", fontWeight: 700, color: colors.DARK_TEXT, margin: "0 0 4px 0" }}>
                          {isPayAtVenue ? "Pay at Venue" : (invoice.payment_method || booking.payment_policy || "Card / Online")}
                        </Text>
                        <Text style={{ fontSize: "12px", color: isPayAtVenue ? colors.GREYSCALE_500 : colors.SUCCESS_TEXT, margin: 0 }}>
                          {isPayAtVenue ? "Pay upon arrival" : `Paid on ${formattedInvoiceDate}.`}
                        </Text>
                      </td>
                      <td style={{ width: "4%" }}></td>
                      <td style={{ width: "48%", verticalAlign: "top", backgroundColor: colors.PEACH_BG, borderRadius: "8px", padding: "16px" }}>
                        <Text style={{ fontSize: "11px", fontWeight: 700, color: colors.GREYSCALE_500, letterSpacing: "0.5px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                          APPOINTMENT:
                        </Text>
                        <Text style={{ fontSize: "15px", fontWeight: 700, color: colors.DARK_TEXT, margin: "0 0 4px 0" }}>
                          {formattedAppointmentTime}
                        </Text>
                        {formattedDuration && (
                          <Text style={{ fontSize: "12px", color: colors.GREYSCALE_500, margin: 0 }}>
                            {formattedDuration}
                          </Text>
                        )}
                      </td>
                    </tr>
                  </table>

                  {/* Bottom Notice */}
                  <Text style={{ fontSize: "12px", color: colors.GREYSCALE_500, lineHeight: "150%", margin: 0 }}>
                    Please ensure to save this invoice for your records. It contains important details regarding your transaction.
                  </Text>
                </>
              );
            })()}

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
