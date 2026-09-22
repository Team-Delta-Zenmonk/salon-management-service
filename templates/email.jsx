import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Img,
  Hr,
  Button,
  Link,
} from "@react-email/components";
import { renderToStaticMarkup } from "react-dom/server";

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
    salonName = "SALON",
    logoUrl = null,
    userName = "Valued Customer",
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
    // Invoice specific data
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
  } = props;

  const brandName = salon.name || props.salonName || salonName || "SALON";
  const brandLogo = salon.logo || logoUrl || null;
  const brandWebsite = salon.website || "www.salon.com";
  const brandAddress = salon.address || "";
  const brandPhone = salon.phone || salon.phone_number || "N/A";
  const brandEmail = salon.email || "N/A";
  const brandAbout = salon.about || salon.type || salon.tagline || "";
  const resetLinkUrl = ctaUrl || props.resetLink || props.resetUrl || props.loginUrl || "";

  let renderedPreview = previewText || `${brandName} Notification`;
  let renderedTitle = title;
  const isInvoice = type === "INVOICE";

  if (type === "FORGOT_PASSWORD") {
    renderedTitle = title || "Password Reset Request";
    renderedPreview = previewText || `Reset your password for ${brandName}`;
  } else if (type === "OTP_VERIFICATION") {
    const isNew = actionType === "NEW_OTP";
    renderedTitle =
      title || (isNew ? "Email Verification Code" : "Your OTP Security Code");
    renderedPreview = previewText || `Your verification code is ${otpCode}`;
  } else if (type === "SALON_LIVE") {
    renderedTitle = title || "🎉 Your Salon is Live!";
    renderedPreview =
      previewText || `Congratulations! ${brandName} is live online`;
  } else if (type === "RESET_PASSWORD") {
    renderedTitle = title || "✓ Password Reset Successful";
    renderedPreview = previewText || `Your password for ${brandName} has been reset`;
  } else if (type === "INVOICE") {
    renderedTitle = "INVOICE";
    renderedPreview =
      previewText ||
      `Invoice #${invoice.invoice_number || invoiceNumber || "DRAFT"} from ${brandName}`;
  }

  const invNumber = invoice.invoice_number || invoiceNumber || "DRAFT";
  const invStatus = (
    invoice.payment_status ||
    paymentStatus ||
    "UNPAID"
  ).toUpperCase();
  const invIssuedAt = invoice.issued_at
    ? typeof invoice.issued_at === "string"
      ? invoice.issued_at
      : new Date(invoice.issued_at).toLocaleDateString("en-IN")
    : "N/A";
  const invMethod = invoice.payment_method || "Pay at Venue";
  const invSubtotal = invoice.subtotal ?? 0;
  const invDiscount = invoice.discount ?? 0;
  const invGrandTotal = invoice.grand_total ?? totalAmount ?? 0;
  const invBalanceDue = invoice.balance_due ?? 0;

  const clientName =
    customer.name || customerName || userName || "Valued Customer";
  const clientPhone = customer.phone_number || "N/A";
  const clientEmail = customer.email || "N/A";

  const bookDate = booking.booking_date || bookingDate || "N/A";
  const bookTime = booking.booking_start_time || "N/A";

  const isPaid = invStatus === "PAID";
  const badgeStyle = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    textTransform: "uppercase",
    backgroundColor: isPaid ? "#D1FAE5" : "#FEE2E2",
    color: isPaid ? "#065F46" : "#991B1B",
    border: `1px solid ${isPaid ? "#A7F3D0" : "#FCA5A5"}`,
  };

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{renderedPreview}</Preview>
      <Body
        style={{
          backgroundColor: "#FAFAFA",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#2C2C2C",
          margin: 0,
          padding: "20px 0",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E5E5E5",
            padding: "24px 32px",
          }}
        >
          {/* Header Section */}
          <Section
            style={{
              borderBottom: "2px solid #D4AF37",
              paddingBottom: "16px",
              marginBottom: "24px",
            }}
          >
            <Row>
              <Column
                style={{
                  width: isInvoice ? "60%" : "100%",
                  verticalAlign: "top",
                  textAlign: isInvoice ? "left" : "center",
                }}
              >
                {brandLogo && (
                  <Img
                    src={brandLogo}
                    alt="Logo"
                    width="48"
                    height="48"
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: "8px",
                      border: "1px solid #E5E5E5",
                      margin: isInvoice ? "0 0 8px 0" : "0 auto 8px auto",
                    }}
                  />
                )}
                <Text
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    color: "#1A1A1A",
                    textTransform: "uppercase",
                    margin: "0 0 4px 0",
                  }}
                >
                  {brandName}
                </Text>
                {brandAbout && (
                  <Text
                    style={{
                      fontSize: "11px",
                      color: "#8C7A6B",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {brandAbout}
                  </Text>
                )}
                {isInvoice && (
                  <Text
                    style={{
                      fontSize: "11px",
                      color: "#666666",
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {brandAddress && (
                      <>
                        {brandAddress}
                        <br />
                      </>
                    )}
                    Phone: {brandPhone} | Email: {brandEmail}
                  </Text>
                )}
              </Column>
              {isInvoice && (
                <Column
                  style={{
                    width: "40%",
                    verticalAlign: "top",
                    textAlign: "right",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "24px",
                      fontWeight: "300",
                      letterSpacing: "3px",
                      color: "#8C7A6B",
                      margin: "0 0 4px 0",
                      textTransform: "uppercase",
                    }}
                  >
                    INVOICE
                  </Text>
                  <Text
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#333333",
                      margin: "0 0 8px 0",
                    }}
                  >
                    #{invNumber}
                  </Text>
                  <span style={badgeStyle}>{invStatus}</span>
                </Column>
              )}
            </Row>
          </Section>

          {/* DYNAMIC CONTENT TYPE: INVOICE */}
          {isInvoice && (
            <>
              <Section
                style={{
                  backgroundColor: "#FAFAFA",
                  borderRadius: "8px",
                  border: "1px solid #E5E5E5",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <Row>
                  <Column
                    style={{
                      width: "50%",
                      verticalAlign: "top",
                      paddingRight: "12px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#8C7A6B",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        margin: "0 0 6px 0",
                      }}
                    >
                      Billed To
                    </Text>
                    <Text
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#1A1A1A",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {clientName}
                    </Text>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#666666",
                        margin: 0,
                        lineHeight: "1.4",
                      }}
                    >
                      Phone: {clientPhone}
                      <br />
                      Email: {clientEmail}
                    </Text>
                  </Column>
                  <Column
                    style={{
                      width: "50%",
                      verticalAlign: "top",
                      paddingLeft: "12px",
                      borderLeft: "1px solid #E5E5E5",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#8C7A6B",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        margin: "0 0 6px 0",
                      }}
                    >
                      Appointment Details
                    </Text>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#666666",
                        margin: "0 0 3px 0",
                      }}
                    >
                      <strong style={{ color: "#333" }}>Invoice Date: </strong>
                      {invIssuedAt}
                    </Text>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#666666",
                        margin: "0 0 3px 0",
                      }}
                    >
                      <strong style={{ color: "#333" }}>Booking Date: </strong>
                      {bookDate}
                    </Text>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#666666",
                        margin: "0 0 3px 0",
                      }}
                    >
                      <strong style={{ color: "#333" }}>Time Slot: </strong>
                      {bookTime}
                    </Text>
                    <Text
                      style={{ fontSize: "12px", color: "#666666", margin: 0 }}
                    >
                      <strong style={{ color: "#333" }}>
                        Payment Method:{" "}
                      </strong>
                      {invMethod}
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section
                style={{
                  marginBottom: "24px",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{ borderCollapse: "collapse", fontSize: "13px" }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#2C2C2C", color: "#FFFFFF" }}>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          width: "8%",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          width: "42%",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Services Booked
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          width: "25%",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Staff Assigned
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          width: "10%",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Duration
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          width: "15%",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingServices.length > 0 ? (
                      bookingServices.map((s, idx) => {
                        const staffName =
                          s.staff?.name ||
                          [s.staff?.first_name, s.staff?.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                          "Assigned Stylist";
                        const isLast = idx === bookingServices.length - 1;
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: isLast
                                ? "none"
                                : "1px solid #F0F0F0",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "center",
                                color: "#888888",
                              }}
                            >
                              0{idx + 1}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <strong style={{ color: "#1A1A1A" }}>
                                {s.service?.name || "Service"}
                              </strong>
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                color: "#8C7A6B",
                                fontSize: "11px",
                              }}
                            >
                              {staffName}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "center",
                                color: "#555",
                              }}
                            >
                              {s.duration_minutes
                                ? `${s.duration_minutes} mins`
                                : "-"}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "right",
                                fontWeight: "600",
                                color: "#222",
                              }}
                            >
                              {formatCurrency(s.price)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            color: "#888888",
                          }}
                        >
                          No services recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Section>

              <Section style={{ marginBottom: "24px" }}>
                <Row>
                  <Column
                    style={{
                      width: "55%",
                      verticalAlign: "top",
                      paddingRight: "16px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#F5F5F0",
                        borderLeft: "3px solid #8C7A6B",
                        padding: "12px",
                        borderRadius: "0 6px 6px 0",
                        fontSize: "12px",
                        color: "#555555",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#2C2C2C",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          fontSize: "10px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Salon Policy &amp; Thank You
                      </div>
                      Thank you for choosing {brandName}! Please arrive 10
                      minutes prior to appointments. Free reschedules up to 24 hours
                      prior.
                    </div>
                  </Column>
                  <Column style={{ width: "45%", verticalAlign: "top" }}>
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E5E5",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <Row style={{ marginBottom: "6px", fontSize: "13px" }}>
                        <Column style={{ color: "#666666" }}>Subtotal</Column>
                        <Column
                          style={{
                            textAlign: "right",
                            fontWeight: "600",
                            color: "#222",
                          }}
                        >
                          {formatCurrency(invSubtotal)}
                        </Column>
                      </Row>
                      <Row style={{ marginBottom: "6px", fontSize: "13px" }}>
                        <Column style={{ color: "#666666" }}>Discount</Column>
                        <Column
                          style={{
                            textAlign: "right",
                            fontWeight: "600",
                            color: "#059669",
                          }}
                        >
                          - {formatCurrency(invDiscount)}
                        </Column>
                      </Row>
                      <Hr style={{ borderColor: "#E5E5E5", margin: "8px 0" }} />
                      <Row style={{ marginBottom: "6px", fontSize: "15px" }}>
                        <Column style={{ color: "#1A1A1A", fontWeight: "700" }}>
                          Grand Total
                        </Column>
                        <Column
                          style={{
                            textAlign: "right",
                            fontWeight: "700",
                            color: "#1A1A1A",
                          }}
                        >
                          {formatCurrency(invGrandTotal)}
                        </Column>
                      </Row>
                      <div
                        style={{
                          backgroundColor: "#FEF2F2",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          marginTop: "8px",
                        }}
                      >
                        <Row>
                          <Column
                            style={{
                              color: "#991B1B",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            Balance Due
                          </Column>
                          <Column
                            style={{
                              textAlign: "right",
                              color: "#991B1B",
                              fontWeight: "700",
                              fontSize: "14px",
                            }}
                          >
                            {formatCurrency(invBalanceDue)}
                          </Column>
                        </Row>
                      </div>
                    </div>
                  </Column>
                </Row>
              </Section>
            </>
          )}

          {/* OTHER EMAIL TYPES */}
          {!isInvoice && (
            <>
              {renderedTitle && (
                <Text
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#1A1A1A",
                    marginBottom: "12px",
                    textAlign: "center",
                  }}
                >
                  {renderedTitle}
                </Text>
              )}

              {userName && (
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#555555",
                    marginBottom: "12px",
                    lineHeight: "1.6",
                  }}
                >
                  Hello <strong>{userName}</strong>,
                </Text>
              )}

              {message && (
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#555555",
                    marginBottom: "20px",
                    lineHeight: "1.6",
                  }}
                >
                  {message}
                </Text>
              )}

              {/* FORGOT PASSWORD */}
              {type === "FORGOT_PASSWORD" && (
                <>
                  {resetLinkUrl ? (
                    <Section style={{ textAlign: "center", marginTop: "20px", marginBottom: "28px" }}>
                      <table
                        width="100%"
                        border="0"
                        cellSpacing="0"
                        cellPadding="0"
                        style={{ margin: "0 auto" }}
                      >
                        <tr>
                          <td align="center">
                            <Button
                              href={resetLinkUrl}
                              style={{
                                backgroundColor: "#D4AF37",
                                color: "#1A1A1A",
                                borderRadius: "6px",
                                fontSize: "15px",
                                fontWeight: "700",
                                textDecoration: "none",
                                display: "inline-block",
                                padding: "14px 32px",
                                border: "1px solid #B89628",
                                textAlign: "center",
                              }}
                            >
                              {ctaText || "Reset Password"}
                            </Button>
                          </td>
                        </tr>
                      </table>
                    </Section>
                  ) : null}
                  <Section
                    style={{
                      backgroundColor: "#FFFBEB",
                      borderLeft: "3px solid #D4AF37",
                      padding: "12px 16px",
                      borderRadius: "0 6px 6px 0",
                      marginBottom: "20px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#92400E",
                        margin: 0,
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>Note:</strong> This link is valid for{" "}
                      <strong>{expiryMinutes} minutes</strong>. If you did not
                      request a password reset, please ignore this email.
                    </Text>
                  </Section>
                  {resetLinkUrl ? (
                    <>
                      <Text
                        style={{
                          fontSize: "12px",
                          color: "#777777",
                          marginBottom: "4px",
                          wordBreak: "break-all",
                        }}
                      >
                        If the button above doesn't work, copy and paste this link into your browser:
                      </Text>
                      <Text style={{ fontSize: "12px", marginBottom: "20px", wordBreak: "break-all" }}>
                        <Link href={resetLinkUrl} style={{ color: "#D4AF37", fontWeight: "600" }}>
                          {resetLinkUrl}
                        </Link>
                      </Text>
                    </>
                  ) : null}
                </>
              )}

              {/* OTP VERIFICATION */}
              {type === "OTP_VERIFICATION" && otpCode && (
                <>
                  <Section
                    style={{
                      backgroundColor: "#1A1A1A",
                      borderRadius: "8px",
                      border: "1px solid #D4AF37",
                      padding: "20px",
                      textAlign: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "36px",
                        fontWeight: "700",
                        letterSpacing: "10px",
                        color: "#D4AF37",
                        margin: 0,
                        fontFamily: "monospace",
                      }}
                    >
                      {otpCode}
                    </Text>
                  </Section>
                  <Section
                    style={{
                      backgroundColor: "#FFFBEB",
                      borderLeft: "3px solid #D4AF37",
                      padding: "12px 16px",
                      borderRadius: "0 6px 6px 0",
                      marginBottom: "20px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#92400E",
                        margin: 0,
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>Security Notice:</strong> This OTP is valid for{" "}
                      <strong>{expiryMinutes} minutes</strong>. Never share this
                      code with anyone.
                    </Text>
                  </Section>
                </>
              )}

              {/* SALON LIVE */}
              {type === "SALON_LIVE" && (
                <>
                  <Section
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#166534",
                        margin: "0 0 4px 0",
                      }}
                    >
                      🎉 Your Salon Profile is Officially Live!
                    </Text>
                    <Text
                      style={{ fontSize: "13px", color: "#15803D", margin: 0 }}
                    >
                      Customers can now view services, check schedules, and place
                      bookings online.
                    </Text>
                  </Section>
                  {dashboardUrl && (
                    <Section style={{ textAlign: "center", marginBottom: "24px" }}>
                      <Button
                        href={dashboardUrl}
                        style={{
                          backgroundColor: "#D4AF37",
                          color: "#1A1A1A",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-block",
                          padding: "12px 28px",
                        }}
                      >
                        {ctaText || "Open Owner Dashboard"}
                      </Button>
                    </Section>
                  )}
                </>
              )}

              {/* RESET PASSWORD */}
              {type === "RESET_PASSWORD" && (
                <>
                  <Section
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#166534",
                        margin: "0 0 4px 0",
                      }}
                    >
                      ✓ Account Security Updated
                    </Text>
                    <Text
                      style={{ fontSize: "13px", color: "#15803D", margin: 0 }}
                    >
                      Your password was successfully changed
                      {changedAt ? ` on ${changedAt}` : ""}.
                    </Text>
                  </Section>
                  {ctaUrl && (
                    <Section style={{ textAlign: "center", marginBottom: "24px" }}>
                      <Button
                        href={ctaUrl}
                        style={{
                          backgroundColor: "#1A1A1A",
                          color: "#FFFFFF",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-block",
                          padding: "12px 28px",
                          border: "1px solid #D4AF37",
                        }}
                      >
                        {ctaText || "Log In Now"}
                      </Button>
                    </Section>
                  )}
                </>
              )}

              {/* GENERIC CTA IF PROVIDED */}
              {type === "GENERIC" && ctaUrl && (
                <Section style={{ textAlign: "center", marginBottom: "24px" }}>
                  <Button
                    href={ctaUrl}
                    style={{
                      backgroundColor: "#1A1A1A",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "700",
                      textDecoration: "none",
                      display: "inline-block",
                      padding: "12px 28px",
                    }}
                  >
                    {ctaText || "Continue"}
                  </Button>
                </Section>
              )}
            </>
          )}

          {/* Footer */}
          <Hr style={{ borderColor: "#E5E5E5", margin: "24px 0 16px 0" }} />
          <Text
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#888888",
              margin: 0,
            }}
          >
            Thank you for using {brandName}! • {brandWebsite}
            <br />© {new Date().getFullYear()} {brandName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const EmailType = Object.freeze({
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
  OTP_VERIFICATION: "OTP_VERIFICATION",
  SALON_LIVE: "SALON_LIVE",
  RESET_PASSWORD: "RESET_PASSWORD",
  INVOICE: "INVOICE",
  GENERIC: "GENERIC",
});

export const buildEmailHtml = (props) => {
  return renderToStaticMarkup(<EmailTemplate {...props} />);
};

export default EmailTemplate;
