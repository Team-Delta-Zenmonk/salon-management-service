const fs = require("fs");
const PDFDocument = require("pdfkit");

const resolveFontPath = (ubuntuPath, alpinePath) => {
  if (fs.existsSync(ubuntuPath)) return ubuntuPath;
  if (fs.existsSync(alpinePath)) return alpinePath;
  return null;
};

const FONT_REGULAR_PATH = resolveFontPath(
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/dejavu/DejaVuSans.ttf"
);
const FONT_BOLD_PATH = resolveFontPath(
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"
);
const FONT_SERIF_PATH = resolveFontPath(
  "/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf",
  null
);

// Font aliases — registered directly, fallback only if system font missing
const FONTS = {
  lora: FONT_SERIF_PATH && fs.existsSync(FONT_SERIF_PATH) ? "Lora" : "Times-Roman",
  regular: FONT_REGULAR_PATH && fs.existsSync(FONT_REGULAR_PATH) ? "Inter" : "Helvetica",
  bold: FONT_BOLD_PATH && fs.existsSync(FONT_BOLD_PATH) ? "Inter-Bold" : "Helvetica-Bold",
};

// Colors matching Figma CSS specifications
const COLORS = {
  primaryOrange: "#F07825",
  darkText: "#121A26",
  bodyText: "#384860",
  mutedText: "#65748A",
  footerDark: "#202B3C",
  border: "#EAECEF",
  rowBorder: "#F1F3F5",
  peachBg: "#FFF5EE",
  successBg: "#EBF7EE",
  successGreen: "#22C55E",
  successText: "#217A52",
  white: "#FFFFFF",
};

// Page Dimensions (A4)
const PAGE = {
  marginX: 48,
  marginY: 32,
  width: 595.28,
  height: 841.89,
};
PAGE.contentWidth = PAGE.width - PAGE.marginX * 2;

// ── Utility functions ──

// ₹ only works with DejaVuSans; Helvetica renders it as superscript ¹
const RUPEE = fs.existsSync(FONT_REGULAR_PATH) ? "₹" : "Rs.";

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `${RUPEE}${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const formatAppointmentTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${weekday}, ${month} ${day} · ${time}`;
};

const formatDuration = (minutes) => {
  const mins = Number(minutes || 0);
  if (!mins) return null;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0 && remMins > 0) return `Duration: ${hrs} hr ${remMins} min`;
  if (hrs > 0) return `Duration: ${hrs} hr`;
  return `Duration: ${remMins} min`;
};

const humanisePaymentMethod = (method) => {
  if (!method) return "Pay at Venue";
  return method
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Simple fetch — salon.logo is always a URL from Cloudinary
const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

const collectPdfBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });

// ── HEADER (first page only) ──

const drawHeader = (doc, { salon }, logoBuffer) => {
  const y = PAGE.marginY;
  const logoSize = 36;
  let textLeft = PAGE.marginX;

  // Salon Logo (circular clip) or fallback initial
  if (logoBuffer) {
    try {
      doc.save();
      doc.circle(PAGE.marginX + logoSize / 2, y + logoSize / 2, logoSize / 2).clip();
      doc.image(logoBuffer, PAGE.marginX, y, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
      doc.restore();
      textLeft += logoSize + 12;
    } catch {
      textLeft = PAGE.marginX;
    }
  } else {
    const initial = (salon.name || "S").charAt(0).toUpperCase();
    doc.save();
    doc.circle(PAGE.marginX + logoSize / 2, y + logoSize / 2, logoSize / 2).fill("#F3F4F6");
    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(initial, PAGE.marginX, y + 10, { width: logoSize, align: "center" });
    doc.restore();
    textLeft += logoSize + 12;
  }

  // Salon Name: Lora 31px
  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.lora)
    .fontSize(31)
    .text(salon.name, textLeft, y + 1, {
      width: PAGE.contentWidth - (textLeft - PAGE.marginX),
      lineBreak: false,
      ellipsis: true,
      characterSpacing: 1,
    });

  // Orange Banner
  const bannerY = y + logoSize + 14;
  const bannerHeight = 50;
  doc.roundedRect(PAGE.marginX, bannerY, PAGE.contentWidth, bannerHeight, 6).fill(COLORS.primaryOrange);

  doc
    .fillColor(COLORS.white)
    .font(FONTS.bold)
    .fontSize(24)
    .text("Payment has been confirmed.", PAGE.marginX + 16, bannerY + 13, {
      width: PAGE.contentWidth - 32,
      lineBreak: false,
      ellipsis: true,
    });

  // Return Y where content starts (below header)
  return bannerY + bannerHeight + 20;
};

// ── FOOTER (last page only, pinned to bottom) ──

const drawFooter = (doc, { salon, customer }) => {
  // Footer is always pinned to the bottom of the current page
  const footerStartY = PAGE.height - 90;

  // Divider above footer
  doc
    .moveTo(PAGE.marginX, footerStartY)
    .lineTo(PAGE.width - PAGE.marginX, footerStartY)
    .strokeColor(COLORS.border)
    .lineWidth(0.75)
    .stroke();

  // Contact line: Inter 14px, #202B3C
  const contactParts = [];
  if (salon.email) contactParts.push(salon.email);
  if (salon.phone || salon.phone_number) contactParts.push(`call ${salon.phone || salon.phone_number}`);
  const contactStr = contactParts.length > 0 ? `Reach out to ${contactParts.join(" or ")}.` : "";
  const line1 = `Questions about your receipt? ${contactStr}`;

  doc
    .fillColor(COLORS.footerDark)
    .font(FONTS.regular)
    .fontSize(14)
    .text(line1, PAGE.marginX, footerStartY + 10, {
      width: PAGE.contentWidth,
      lineGap: 2,
    });

  // Security line: Inter 12px, #65748A
  const customerEmail = customer.email || "";
  const line2 = customerEmail
    ? `This automated security email was sent to ${customerEmail}. Please do not reply.`
    : "This is an automated invoice. Please do not reply.";

  doc
    .fillColor(COLORS.mutedText)
    .font(FONTS.regular)
    .fontSize(12)
    .text(line2, PAGE.marginX, doc.y + 6, {
      width: PAGE.contentWidth,
      lineGap: 2,
    });
};

// ── SECTION 1: STATUS BADGE ──

const drawStatusBadge = (doc, startY, { invoice }) => {
  const cardHeight = 48;
  const isUnpaid = invoice.payment_status === "UNPAID";
  const bg = isUnpaid ? COLORS.peachBg : COLORS.successBg;

  doc.roundedRect(PAGE.marginX, startY, PAGE.contentWidth, cardHeight, 6).fill(bg);

  // Icon
  const iconRadius = 14;
  const iconX = PAGE.marginX + 16 + iconRadius;
  const iconY = startY + cardHeight / 2;

  if (isUnpaid) {
    doc.circle(iconX, iconY, iconRadius).fill(COLORS.primaryOrange);
    doc.fillColor(COLORS.white).font(FONTS.bold).fontSize(16).text("!", iconX - iconRadius, iconY - 9, { width: iconRadius * 2, align: "center" });
  } else {
    doc.circle(iconX, iconY, iconRadius).fill(COLORS.successGreen);
    doc.fillColor(COLORS.white).font(FONTS.bold).fontSize(14).text("✓", iconX - iconRadius, iconY - 8, { width: iconRadius * 2, align: "center" });
  }

  // Badge text
  const badgeText = isUnpaid
    ? `Unpaid: ${formatCurrency(invoice.grand_total)}`
    : `Successfully paid: ${formatCurrency(invoice.grand_total)}.`;

  const textX = PAGE.marginX + 16 + iconRadius * 2 + 12;
  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.bold)
    .fontSize(16)
    .text(badgeText, textX, startY + 15, {
      width: PAGE.contentWidth - (textX - PAGE.marginX) - 16,
      lineBreak: false,
      ellipsis: true,
    });

  return startY + cardHeight + 20;
};

// ── SECTION 2: GREETING & SUBTITLE ──

const drawGreeting = (doc, startY, { customer }) => {
  const firstName = (customer.name || "there").split(" ")[0];

  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.regular)
    .fontSize(22)
    .text(`Thanks, ${firstName}!`, PAGE.marginX, startY, {
      width: PAGE.contentWidth,
      lineBreak: false,
      ellipsis: true,
    });

  const subtitleY = startY + 24 + 14;

  doc
    .fillColor(COLORS.bodyText)
    .font(FONTS.regular)
    .fontSize(16)
    .text("Your salon appointment is confirmed.", PAGE.marginX, subtitleY, {
      width: PAGE.contentWidth,
      lineBreak: false,
      ellipsis: true,
      characterSpacing: 0.2,
    });

  return subtitleY + 20 + 20;
};

// ── SECTION 3: INVOICE NUMBER & DATE ──

const drawInvoiceMeta = (doc, startY, { invoice }) => {
  let y = startY;
  const colWidth = (PAGE.contentWidth - 20) / 2;
  const rightX = PAGE.width - PAGE.marginX - colWidth;

  // Labels
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text("INVOICE NUMBER:", PAGE.marginX, y, { characterSpacing: 0.6 });
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text("INVOICE DATE:", rightX, y, { align: "right", width: colWidth, characterSpacing: 0.6 });

  y += 16;

  // Values
  doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14).text(invoice.invoice_number, PAGE.marginX, y, { width: colWidth, ellipsis: true });
  doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14).text(formatDate(invoice.issued_at || invoice.created_at), rightX, y, { align: "right", width: colWidth, ellipsis: true });

  y += 20;

  // Divider
  doc.moveTo(PAGE.marginX, y).lineTo(PAGE.width - PAGE.marginX, y).strokeColor(COLORS.border).lineWidth(0.75).stroke();

  return y + 16;
};

// ── SECTION 4: SALON & CUSTOMER ──

const drawPartiesInfo = (doc, startY, { salon, customer = {} }) => {
  const colWidth = (PAGE.contentWidth - 24) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + colWidth + 24;

  // Labels
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text("SALON:", leftX, startY, { characterSpacing: 0.6 });
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text("CUSTOMER:", rightX, startY, { align: "right", width: colWidth, characterSpacing: 0.6 });

  let sy = startY + 16;
  let cy = startY + 16;

  // Salon info
  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(salon.name, leftX, sy, { width: colWidth, lineBreak: false, ellipsis: true });
  sy += 16;

  doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
  if (salon.address) {
    doc.text(salon.address, leftX, sy, { width: colWidth, lineBreak: false, ellipsis: true });
    sy += 16;
  }
  const cityState = [salon.city, salon.state, salon.zip_code].filter(Boolean).join(", ");
  if (cityState) {
    doc.text(cityState, leftX, sy, { width: colWidth, lineBreak: false, ellipsis: true });
    sy += 16;
  }

  // Customer info (resolved upfront by caller)
  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(customer.name || "Customer", rightX, cy, { align: "right", width: colWidth, lineBreak: false, ellipsis: true });
  cy += 16;
  doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
  if (customer.email) {
    doc.text(customer.email, rightX, cy, { align: "right", width: colWidth, lineBreak: false, ellipsis: true });
    cy += 16;
  }
  if (customer.phone) {
    doc.text(customer.phone, rightX, cy, { align: "right", width: colWidth, lineBreak: false, ellipsis: true });
    cy += 16;
  }

  return Math.max(sy, cy) + 18;
};

// ── SECTION 5: SERVICES TABLE ──

const drawServicesTable = (doc, startY, { bookingServices, invoice }) => {
  let y = startY;
  const headerHeight = 28;
  const startTableY = y;

  // Header background
  doc.roundedRect(PAGE.marginX, y, PAGE.contentWidth, headerHeight, 4).fill(COLORS.peachBg);

  // Header labels
  doc.fillColor(COLORS.bodyText).font(FONTS.bold).fontSize(11);
  doc.text("SERVICE", PAGE.marginX + 16, y + 8, { characterSpacing: 0.7 });
  doc.text("QUANTITY", PAGE.marginX + 300, y + 8, { width: 80, align: "center", characterSpacing: 0.7 });
  doc.text("PRICE", PAGE.width - PAGE.marginX - 100, y + 8, { width: 84, align: "right", characterSpacing: 0.7 });

  y += headerHeight;

  // Item Rows
  bookingServices.forEach((item) => {
    const sName = item.service?.name || item.name || "Service";
    const sQty = String(item.quantity || 1);
    const sPrice = formatCurrency(item.price || item.rate || 0);
    const rowHeight = 32;

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(sName, PAGE.marginX + 16, y + 7, {
      width: 280,
      lineBreak: false,
      ellipsis: true,
    });

    doc.fillColor(COLORS.bodyText).font(FONTS.regular).fontSize(14).text(sQty, PAGE.marginX + 300, y + 7, {
      width: 80,
      align: "center",
    });

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(sPrice, PAGE.width - PAGE.marginX - 100, y + 7, {
      width: 84,
      align: "right",
    });

    y += rowHeight;
    doc.moveTo(PAGE.marginX + 16, y).lineTo(PAGE.width - PAGE.marginX - 16, y).strokeColor(COLORS.rowBorder).lineWidth(0.5).stroke();
  });

  // Totals
  const totLabelX = PAGE.width - PAGE.marginX - 220;
  const totWidth = 204;
  let totalsY = y + 8;

  // Subtotal
  doc.fillColor(COLORS.bodyText).font(FONTS.regular).fontSize(14).text("Subtotal:", totLabelX, totalsY);
  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(formatCurrency(invoice.subtotal || invoice.sub_total || invoice.grand_total), totLabelX, totalsY, { align: "right", width: totWidth });

  totalsY += 20;

  // Total due/paid
  const isUnpaid = invoice.payment_status === "UNPAID";
  const totalLabel = isUnpaid ? "Total due:" : "Total paid:";
  const totalColor = isUnpaid ? COLORS.darkText : COLORS.successText;

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(16).text(totalLabel, totLabelX, totalsY);
  doc.fillColor(totalColor).font(FONTS.bold).fontSize(18).text(formatCurrency(invoice.grand_total), totLabelX, totalsY, { align: "right", width: totWidth });

  const totalTableHeight = totalsY + 26 - startTableY;
  doc.roundedRect(PAGE.marginX, startTableY, PAGE.contentWidth, totalTableHeight, 6).strokeColor(COLORS.border).lineWidth(0.75).stroke();

  return startTableY + totalTableHeight + 18;
};

// ── SECTION 6: PAYMENT METHOD & APPOINTMENT CARDS ──

const drawInfoCards = (doc, startY, { invoice, booking }) => {
  const cardWidth = (PAGE.contentWidth - 12) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + cardWidth + 12;
  const cardHeight = 72;

  const isUnpaid = invoice.payment_status === "UNPAID";

  // Left Card: Payment Method
  doc.roundedRect(leftX, startY, cardWidth, cardHeight, 6).fill(COLORS.peachBg);
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("PAYMENT METHOD:", leftX + 16, startY + 12, { characterSpacing: 0.6 });

  const methodTitle = isUnpaid ? "Pay at Venue" : humanisePaymentMethod(invoice.payment_method);
  const methodSub = isUnpaid ? "Pay upon arrival" : `Paid on ${formatDate(invoice.issued_at || invoice.created_at)}.`;
  const subColor = isUnpaid ? COLORS.mutedText : COLORS.successText;

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(methodTitle, leftX + 16, startY + 28, {
    width: cardWidth - 32,
    lineBreak: false,
    ellipsis: true,
  });

  doc.fillColor(subColor).font(FONTS.regular).fontSize(12).text(methodSub, leftX + 16, startY + 46, {
    width: cardWidth - 32,
    lineBreak: false,
    ellipsis: true,
  });

  // Right Card: Appointment
  doc.roundedRect(rightX, startY, cardWidth, cardHeight, 6).fill(COLORS.peachBg);
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("APPOINTMENT:", rightX + 16, startY + 12, { characterSpacing: 0.6 });

  const apptTime = formatAppointmentTime(booking.booking_start_time || booking.booking_date);
  const durationStr = formatDuration(booking.total_duration);

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(apptTime, rightX + 16, startY + 28, {
    width: cardWidth - 32,
    lineBreak: false,
    ellipsis: true,
  });

  if (durationStr) {
    doc.fillColor(COLORS.mutedText).font(FONTS.regular).fontSize(12).text(durationStr, rightX + 16, startY + 46, {
      width: cardWidth - 32,
      lineBreak: false,
      ellipsis: true,
    });
  }

  return startY + cardHeight + 16;
};

// ── SECTION 7: RECORD NOTICE ──

const drawNotice = (doc, startY) => {
  doc
    .fillColor(COLORS.mutedText)
    .font(FONTS.regular)
    .fontSize(12)
    .text(
      "Please ensure to save this invoice for your records. It contains important details regarding your transaction.",
      PAGE.marginX,
      startY,
      { width: PAGE.contentWidth }
    );
};

// ── MAIN INVOICE PDF GENERATOR ──

exports.generateInvoicePDF = async ({ invoice = {}, booking = {}, salon = {}, customer = {}, bookingServices = [] }) => {
  const logoBuffer = await fetchImageBuffer(salon.logo);

  const doc = new PDFDocument({
    margin: 0,
    size: "A4",
    bufferPages: true,
  });

  // Register system fonts directly
  if (fs.existsSync(FONT_SERIF_PATH)) doc.registerFont("Lora", FONT_SERIF_PATH);
  if (fs.existsSync(FONT_REGULAR_PATH)) doc.registerFont("Inter", FONT_REGULAR_PATH);
  if (fs.existsSync(FONT_BOLD_PATH)) doc.registerFont("Inter-Bold", FONT_BOLD_PATH);

  const bufferPromise = collectPdfBuffer(doc);

  // 1. Header (first page only) — returns Y where content starts
  let y = drawHeader(doc, { salon }, logoBuffer);

  // 2. Status Badge
  y = drawStatusBadge(doc, y, { invoice });

  // 3. Greeting & Subtitle
  y = drawGreeting(doc, y, { customer });

  // 4. Invoice Number & Date
  y = drawInvoiceMeta(doc, y, { invoice });

  // 5. Salon & Customer Info
  y = drawPartiesInfo(doc, y, { salon, customer });

  // Page break check before table
  if (y + 110 > PAGE.height - 100) {
    doc.addPage();
    y = PAGE.marginY;
  }

  // 6. Services Table
  y = drawServicesTable(doc, y, { bookingServices, invoice });

  // Page break check before cards
  if (y + 76 > PAGE.height - 100) {
    doc.addPage();
    y = PAGE.marginY;
  }

  // 7. Payment Method & Appointment Cards
  y = drawInfoCards(doc, y, { invoice, booking });

  // Page break check before notice
  if (y + 24 > PAGE.height - 100) {
    doc.addPage();
    y = PAGE.marginY;
  }

  // 8. Notice
  drawNotice(doc, y);

  // 9. Footer (last page only, pinned to bottom)
  const range = doc.bufferedPageRange();
  const lastPage = range.start + range.count - 1;
  doc.switchToPage(lastPage);
  drawFooter(doc, { salon, customer });

  doc.end();

  return bufferPromise;
};