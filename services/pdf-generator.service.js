const fs = require("fs");
const path = require("path");
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

const FONTS = {
  lora: FONT_SERIF_PATH && fs.existsSync(FONT_SERIF_PATH) ? "Lora" : "Times-Roman",
  regular: FONT_REGULAR_PATH && fs.existsSync(FONT_REGULAR_PATH) ? "Inter" : "Helvetica",
  bold: FONT_BOLD_PATH && fs.existsSync(FONT_BOLD_PATH) ? "Inter-Bold" : "Helvetica-Bold",
};

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

const PAGE = {
  marginX: 48,
  marginY: 32,
  width: 595.28,
  height: 841.89,
};
PAGE.contentWidth = PAGE.width - PAGE.marginX * 2;

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

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    if (typeof url === "string" && !url.startsWith("http")) {
      const localPath = path.resolve(url);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }
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

const drawHeader = (doc, { salon, type, invoice }, logoBuffer) => {
  const y = PAGE.marginY;
  const logoSize = 36;
  let textLeft = PAGE.marginX;

  const brandName = process.env.BRAND_NAME || "Vellora";
  const headerTitle =
    type === "BOOKING"
      ? (salon?.name || "Salon")
      : brandName;

  if (logoBuffer) {
    try {
      const img = doc.openImage(logoBuffer);
      const imgW = img.width || logoSize;
      const imgH = img.height || logoSize;

      const scale = Math.min(logoSize / imgW, logoSize / imgH);
      const renderW = Math.round(imgW * scale);
      const renderH = Math.round(imgH * scale);

      const posX = PAGE.marginX + Math.round((logoSize - renderW) / 2);
      const posY = y + Math.round((logoSize - renderH) / 2);

      doc.save();
      const cornerRadius = Math.min(4, Math.floor(renderH / 4), Math.floor(renderW / 4));
      if (cornerRadius > 0) {
        doc.roundedRect(posX, posY, renderW, renderH, cornerRadius).clip();
      }
      doc.image(img, posX, posY, { width: renderW, height: renderH });
      doc.restore();
      textLeft += logoSize + 12;
    } catch {
      textLeft = PAGE.marginX;
    }
  } else {
    const initial = headerTitle.charAt(0).toUpperCase();
    doc.save();
    doc.circle(PAGE.marginX + logoSize / 2, y + logoSize / 2, logoSize / 2).fill("#F3F4F6");
    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14).text(initial, PAGE.marginX, y + 10, { width: logoSize, align: "center" });
    doc.restore();
    textLeft += logoSize + 12;
  }

  const maxHeaderWidth = PAGE.contentWidth - (textLeft - PAGE.marginX);
  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.lora)
    .fontSize(24);

  const headerHeight = doc.heightOfString(headerTitle, {
    width: maxHeaderWidth,
    characterSpacing: 0.5,
  });

  doc.text(headerTitle, textLeft, y + 2, {
    width: maxHeaderWidth,
    characterSpacing: 0.5,
  });

  const headerBottom = Math.max(y + logoSize, y + 2 + headerHeight);
  const bannerY = headerBottom + 14;

  const isUnpaid = invoice && (invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED");
  const bannerText =
    type === "SUBSCRIPTION"
      ? "Subscription payment confirmed."
      : type === "THEME"
      ? "Theme purchase confirmed."
      : isUnpaid
      ? "Booking appointment confirmed."
      : "Payment has been confirmed.";

  const maxBannerWidth = PAGE.contentWidth - 32;
  doc
    .fillColor(COLORS.white)
    .font(FONTS.bold)
    .fontSize(20);

  const bannerTextHeight = doc.heightOfString(bannerText, { width: maxBannerWidth });
  const bannerHeight = Math.max(48, bannerTextHeight + 20);

  doc.roundedRect(PAGE.marginX, bannerY, PAGE.contentWidth, bannerHeight, 6).fill(COLORS.primaryOrange);
  doc.fillColor(COLORS.white).font(FONTS.bold).fontSize(20).text(bannerText, PAGE.marginX + 16, bannerY + (bannerHeight - bannerTextHeight) / 2, {
    width: maxBannerWidth,
  });

  return bannerY + bannerHeight + 20;
};

const drawFooter = (doc, { salon, customer, type }) => {
  let line1 = `Questions about your receipt? Reach out to ${process.env.SUPPORT_EMAIL || "support@zenmonk.tech"}.`;
  if (type === "BOOKING") {
    const contactParts = [];
    if (salon.email) contactParts.push(salon.email);
    if (salon.phone || salon.phone_number) contactParts.push(`call ${salon.phone || salon.phone_number}`);
    const contactStr = contactParts.length > 0 ? `Reach out to ${contactParts.join(" or ")}.` : "";
    line1 = `Questions about your receipt? ${contactStr}`;
  }

  const recipientEmail =
    type === "BOOKING" ? (customer.email || "") : (salon.email || "");
  const line2 = recipientEmail
    ? `This automated receipt was sent to ${recipientEmail}. Please do not reply.`
    : "This is an automated invoice. Please do not reply.";

  doc.font(FONTS.regular).fontSize(11);
  const line1H = doc.heightOfString(line1, { width: PAGE.contentWidth });
  doc.font(FONTS.regular).fontSize(10);
  const line2H = doc.heightOfString(line2, { width: PAGE.contentWidth });

  const totalFooterH = 10 + line1H + 6 + line2H + 10;
  const footerStartY = PAGE.height - PAGE.marginY - totalFooterH;

  doc
    .moveTo(PAGE.marginX, footerStartY)
    .lineTo(PAGE.width - PAGE.marginX, footerStartY)
    .strokeColor(COLORS.border)
    .lineWidth(0.75)
    .stroke();

  doc
    .fillColor(COLORS.footerDark)
    .font(FONTS.regular)
    .fontSize(11);

  doc.text(line1, PAGE.marginX, footerStartY + 8, {
    width: PAGE.contentWidth,
  });

  doc
    .fillColor(COLORS.mutedText)
    .font(FONTS.regular)
    .fontSize(10);

  doc.text(line2, PAGE.marginX, footerStartY + 8 + line1H + 4, {
    width: PAGE.contentWidth,
  });
};

const drawStatusBadge = (doc, startY, { invoice }) => {
  const iconRadius = 14;
  const iconX = PAGE.marginX + 16 + iconRadius;
  const textX = PAGE.marginX + 16 + iconRadius * 2 + 12;
  const maxBadgeWidth = PAGE.contentWidth - (textX - PAGE.marginX) - 16;

  const isUnpaid = invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED";
  const bg = isUnpaid ? COLORS.peachBg : COLORS.successBg;

  const badgeText = isUnpaid
    ? `Pending / Unpaid: ${formatCurrency(invoice.grand_total || invoice.amount)}`
    : `Successfully paid: ${formatCurrency(invoice.grand_total || invoice.amount)}.`;

  doc.font(FONTS.bold).fontSize(15);
  const badgeTextHeight = doc.heightOfString(badgeText, { width: maxBadgeWidth });
  const cardHeight = Math.max(48, badgeTextHeight + 22);

  doc.roundedRect(PAGE.marginX, startY, PAGE.contentWidth, cardHeight, 6).fill(bg);

  const iconY = startY + cardHeight / 2;
  if (isUnpaid) {
    doc.circle(iconX, iconY, iconRadius).fill(COLORS.primaryOrange);
    doc.fillColor(COLORS.white).font(FONTS.bold).fontSize(16).text("!", iconX - iconRadius, iconY - 9, { width: iconRadius * 2, align: "center" });
  } else {
    doc.circle(iconX, iconY, iconRadius).fill(COLORS.successGreen);
    doc.fillColor(COLORS.white).font(FONTS.bold).fontSize(14).text("✓", iconX - iconRadius, iconY - 8, { width: iconRadius * 2, align: "center" });
  }

  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.bold)
    .fontSize(15);

  doc.text(badgeText, textX, startY + (cardHeight - badgeTextHeight) / 2, {
    width: maxBadgeWidth,
  });

  return startY + cardHeight + 20;
};

const drawGreeting = (doc, startY, { customer, salon, type, invoice }) => {
  let title = "Thanks!";
  let subtitle = "Your transaction has been processed.";

  if (type === "BOOKING") {
    const firstName = (customer.name || "there").split(" ")[0];
    title = `Thanks, ${firstName}!`;
    subtitle = "Your salon appointment is confirmed.";
  } else if (type === "SUBSCRIPTION") {
    const salonName = salon.name || "Partner";
    const planName = invoice.metadata?.plan || invoice.plan || "Subscription";
    title = `Thanks, ${salonName}!`;
    subtitle = `Your ${planName} plan is now active.`;
  } else if (type === "THEME") {
    const salonName = salon.name || "Partner";
    const themeName = invoice.metadata?.theme_name || invoice.theme?.name || "Storefront Theme";
    title = `Thanks, ${salonName}!`;
    subtitle = `Your license for ${themeName} is now active.`;
  }

  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.regular)
    .fontSize(22);

  const titleHeight = doc.heightOfString(title, { width: PAGE.contentWidth });
  doc.text(title, PAGE.marginX, startY, { width: PAGE.contentWidth });

  const subtitleY = startY + titleHeight + 10;

  doc
    .fillColor(COLORS.bodyText)
    .font(FONTS.regular)
    .fontSize(15);

  const subtitleHeight = doc.heightOfString(subtitle, { width: PAGE.contentWidth, characterSpacing: 0.2 });
  doc.text(subtitle, PAGE.marginX, subtitleY, {
    width: PAGE.contentWidth,
    characterSpacing: 0.2,
  });

  return subtitleY + subtitleHeight + 20;
};

const drawInvoiceMeta = (doc, startY, { invoice }) => {
  let y = startY;
  const colWidth = (PAGE.contentWidth - 20) / 2;
  const rightX = PAGE.width - PAGE.marginX - colWidth;

  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("INVOICE NUMBER:", PAGE.marginX, y, { characterSpacing: 0.6 });
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("INVOICE DATE:", rightX, y, { align: "right", width: colWidth, characterSpacing: 0.6 });

  y += 16;

  doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(13);
  const invNumber = invoice.invoice_number || "";
  const numHeight = doc.heightOfString(invNumber, { width: colWidth });
  doc.text(invNumber, PAGE.marginX, y, { width: colWidth });

  const dateStr = formatDate(invoice.issued_at || invoice.created_at);
  const dateHeight = doc.heightOfString(dateStr, { width: colWidth, align: "right" });
  doc.text(dateStr, rightX, y, { align: "right", width: colWidth });

  y += Math.max(numHeight, dateHeight) + 14;

  doc.moveTo(PAGE.marginX, y).lineTo(PAGE.width - PAGE.marginX, y).strokeColor(COLORS.border).lineWidth(0.75).stroke();

  return y + 16;
};

const drawPartiesInfo = (doc, startY, { salon = {}, customer = {}, type }) => {
  const colWidth = (PAGE.contentWidth - 24) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + colWidth + 24;

  const leftLabel = type === "BOOKING" ? "SALON:" : "BILLED BY:";
  const rightLabel = type === "BOOKING" ? "CUSTOMER:" : "BILLED TO:";

  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text(leftLabel, leftX, startY, { characterSpacing: 0.6 });
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text(rightLabel, rightX, startY, { align: "right", width: colWidth, characterSpacing: 0.6 });

  let sy = startY + 16;
  let cy = startY + 16;

  const renderLeft = (text, font, size, color = COLORS.darkText, spacingAfter = 3) => {
    if (!text) return;
    const str = String(text).trim();
    if (!str) return;
    doc.fillColor(color).font(font).fontSize(size);
    doc.text(str, leftX, sy, { width: colWidth });
    sy += doc.heightOfString(str, { width: colWidth }) + spacingAfter;
  };

  const renderRight = (text, font, size, color = COLORS.darkText, spacingAfter = 3) => {
    if (!text) return;
    const str = String(text).trim();
    if (!str) return;
    doc.fillColor(color).font(font).fontSize(size);
    doc.text(str, rightX, cy, { align: "right", width: colWidth });
    cy += doc.heightOfString(str, { align: "right", width: colWidth }) + spacingAfter;
  };

  if (type === "BOOKING") {
    renderLeft(salon.name || "Salon", FONTS.bold, 13, COLORS.darkText, 4);
    if (salon.address) {
      renderLeft(salon.address, FONTS.regular, 12, COLORS.bodyText, 3);
    }
    const cityState = [salon.city, salon.state, salon.zip_code].filter(Boolean).join(", ");
    if (cityState) {
      renderLeft(cityState, FONTS.regular, 12, COLORS.bodyText, 3);
    }
    if (salon.phone || salon.phone_number) {
      renderLeft(salon.phone || salon.phone_number, FONTS.regular, 12, COLORS.mutedText, 3);
    }
    if (salon.email) {
      renderLeft(salon.email, FONTS.regular, 12, COLORS.mutedText, 3);
    }

    renderRight(customer.name || "Customer", FONTS.bold, 13, COLORS.darkText, 4);
    if (customer.email) {
      renderRight(customer.email, FONTS.regular, 12, COLORS.bodyText, 3);
    }
    if (customer.phone) {
      renderRight(customer.phone, FONTS.regular, 12, COLORS.bodyText, 3);
    }
  } else {
    const brandName = process.env.BRAND_NAME || "Vellora";
    renderLeft(brandName, FONTS.bold, 13, COLORS.darkText, 4);
    renderLeft("Cloud Salon Software Suite", FONTS.regular, 12, COLORS.bodyText, 3);
    renderLeft(process.env.SUPPORT_EMAIL || "support@zenmonk.tech", FONTS.regular, 12, COLORS.mutedText, 3);

    renderRight(salon.name || "Salon Partner", FONTS.bold, 13, COLORS.darkText, 4);
    if (salon.email) {
      renderRight(salon.email, FONTS.regular, 12, COLORS.bodyText, 3);
    }
    if (salon.phone || salon.phone_number) {
      renderRight(salon.phone || salon.phone_number, FONTS.regular, 12, COLORS.bodyText, 3);
    }
    if (salon.address) {
      renderRight(salon.address, FONTS.regular, 12, COLORS.mutedText, 3);
    }
    const cityState = [salon.city, salon.state, salon.zip_code].filter(Boolean).join(", ");
    if (cityState) {
      renderRight(cityState, FONTS.regular, 12, COLORS.mutedText, 3);
    }
  }

  return Math.max(sy, cy) + 18;
};

const drawServicesTable = (doc, startY, { items = [], invoice, type }) => {
  let y = startY;
  const headerHeight = 28;
  const startTableY = y;

  doc.roundedRect(PAGE.marginX, y, PAGE.contentWidth, headerHeight, 4).fill(COLORS.peachBg);

  const col1Label = type === "BOOKING" ? "SERVICE" : "ITEM DESCRIPTION";
  const col2Label = type === "BOOKING" ? "QUANTITY" : "DURATION / TYPE";

  const tableLeft = PAGE.marginX + 16;
  const tableRight = PAGE.width - PAGE.marginX - 16;
  const descColWidth = 230;
  const qtyColWidth = 90;
  const qtyColX = tableLeft + 235;
  const priceColWidth = 130;
  const priceColX = tableRight - priceColWidth;

  doc.fillColor(COLORS.bodyText).font(FONTS.bold).fontSize(11);
  doc.text(col1Label, tableLeft, y + 8, { width: descColWidth, characterSpacing: 0.7 });
  doc.text(col2Label, qtyColX, y + 8, { width: qtyColWidth, align: "center", characterSpacing: 0.7 });
  doc.text("PRICE", priceColX, y + 8, { width: priceColWidth, align: "right", characterSpacing: 0.7 });

  y += headerHeight;

  items.forEach((item) => {
    const sName = item.service?.name || item.name || "Item";
    const sQty = String(item.quantity || item.details || "1");
    const sPrice = formatCurrency(item.price || item.rate || 0);

    doc.font(FONTS.bold).fontSize(13);
    const nameHeight = doc.heightOfString(sName, { width: descColWidth });
    const rowHeight = Math.max(32, nameHeight + 14);

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
    doc.text(sName, tableLeft, y + 7, {
      width: descColWidth,
    });

    doc.fillColor(COLORS.bodyText).font(FONTS.regular).fontSize(13);
    doc.text(sQty, qtyColX, y + 7, {
      width: qtyColWidth,
      align: "center",
    });

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
    doc.text(sPrice, priceColX, y + 7, {
      width: priceColWidth,
      align: "right",
    });

    y += rowHeight;
    doc.moveTo(tableLeft, y).lineTo(tableRight, y).strokeColor(COLORS.rowBorder).lineWidth(0.5).stroke();
  });

  const totalsPriceWidth = 140;
  const totalsPriceX = tableRight - totalsPriceWidth;
  const totalsLabelWidth = 140;
  const totalsLabelX = totalsPriceX - totalsLabelWidth - 14;
  let totalsY = y + 8;

  const grandTotal = invoice.grand_total || invoice.amount || 0;

  doc.fillColor(COLORS.bodyText).font(FONTS.regular).fontSize(13).text("Subtotal:", totalsLabelX, totalsY, {
    width: totalsLabelWidth,
    align: "right",
  });
  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
  doc.text(formatCurrency(grandTotal), totalsPriceX, totalsY, {
    width: totalsPriceWidth,
    align: "right",
  });

  totalsY += 22;

  const isUnpaid = invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED";
  const totalLabel = isUnpaid ? "Total due:" : "Total paid:";
  const totalColor = isUnpaid ? COLORS.darkText : COLORS.successText;

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(15).text(totalLabel, totalsLabelX, totalsY, {
    width: totalsLabelWidth,
    align: "right",
  });
  doc.fillColor(totalColor).font(FONTS.bold).fontSize(17);
  doc.text(formatCurrency(grandTotal), totalsPriceX, totalsY, {
    width: totalsPriceWidth,
    align: "right",
  });

  const totalTableHeight = totalsY + 28 - startTableY;
  doc.roundedRect(PAGE.marginX, startTableY, PAGE.contentWidth, totalTableHeight, 6).strokeColor(COLORS.border).lineWidth(0.75).stroke();

  return startTableY + totalTableHeight + 18;
};

const drawInfoCards = (doc, startY, { invoice, booking = {}, type, metadata = {} }) => {
  const cardWidth = (PAGE.contentWidth - 12) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + cardWidth + 12;
  const maxInnerWidth = cardWidth - 32;

  const isUnpaid = invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED";

  const statusTitle = isUnpaid ? "Payment Pending" : "Paid";
  const statusSub = isUnpaid ? "Payment due" : `Paid on ${formatDate(invoice.issued_at || invoice.created_at)}.`;
  const subColor = isUnpaid ? COLORS.mutedText : COLORS.successText;

  let rightTitle = "";
  let rightSub = "";
  let rightSub2 = "";

  if (type === "BOOKING") {
    rightTitle = "APPOINTMENT:";
    rightSub = formatAppointmentTime(booking.booking_start_time || booking.booking_date);
    rightSub2 = formatDuration(booking.total_duration) || "";
  } else if (type === "SUBSCRIPTION") {
    rightTitle = "VALIDITY & ACCESS:";
    const cycle = metadata.billing_cycle || invoice.billing_cycle || "Monthly";
    const end = metadata.billing_period_end ? formatDate(metadata.billing_period_end) : "Active";
    const formattedCycle = cycle ? cycle.charAt(0).toUpperCase() + cycle.slice(1) : "Monthly";
    rightSub = `Valid to: ${end}`;
    rightSub2 = `Billing Cycle: ${formattedCycle}`;
  } else {
    rightTitle = "LICENSE TYPE:";
    rightSub = "Lifetime Access";
    rightSub2 = "Unlimited storefront usage";
  }

  doc.font(FONTS.bold).fontSize(13);
  const leftTitleH = doc.heightOfString(statusTitle, { width: maxInnerWidth });
  const rightSubH = doc.heightOfString(rightSub, { width: maxInnerWidth });

  doc.font(FONTS.regular).fontSize(12);
  const leftSubH = doc.heightOfString(statusSub, { width: maxInnerWidth });
  const rightSub2H = rightSub2 ? doc.heightOfString(rightSub2, { width: maxInnerWidth }) : 0;

  const leftContentH = 28 + leftTitleH + 4 + leftSubH + 12;
  const rightContentH = 28 + rightSubH + 4 + rightSub2H + 12;
  const cardHeight = Math.max(76, leftContentH, rightContentH);

  doc.roundedRect(leftX, startY, cardWidth, cardHeight, 6).fill(COLORS.peachBg);
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("PAYMENT STATUS:", leftX + 16, startY + 12, { characterSpacing: 0.6 });

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
  doc.text(statusTitle, leftX + 16, startY + 28, {
    width: maxInnerWidth,
  });

  doc.fillColor(subColor).font(FONTS.regular).fontSize(12);
  doc.text(statusSub, leftX + 16, startY + 28 + leftTitleH + 4, {
    width: maxInnerWidth,
  });

  doc.roundedRect(rightX, startY, cardWidth, cardHeight, 6).fill(COLORS.peachBg);
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text(rightTitle, rightX + 16, startY + 12, { characterSpacing: 0.6 });

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
  doc.text(rightSub, rightX + 16, startY + 28, {
    width: maxInnerWidth,
  });

  if (rightSub2) {
    doc.fillColor(COLORS.mutedText).font(FONTS.regular).fontSize(12);
    doc.text(rightSub2, rightX + 16, startY + 28 + rightSubH + 4, {
      width: maxInnerWidth,
    });
  }

  return startY + cardHeight + 16;
};

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

exports.generateInvoicePDF = async ({
  invoice = {},
  booking = {},
  salon = {},
  customer = {},
  bookingServices = [],
  items = null,
  type = null,
}) => {
  const resolvedType = (type || invoice.invoice_type || "BOOKING").toUpperCase();

  let logoBuffer = null;
  if (resolvedType === "BOOKING") {
    logoBuffer = await fetchImageBuffer(salon.logo);
  } else {
    const localLogoPath = path.join(__dirname, "../public/assets/logo.png");
    logoBuffer = await fetchImageBuffer(localLogoPath);
  }

  let resolvedItems = items;
  if (!resolvedItems || resolvedItems.length === 0) {
    if (resolvedType === "BOOKING") {
      resolvedItems = bookingServices;
    } else if (resolvedType === "SUBSCRIPTION") {
      const rawPlan = invoice.metadata?.plan || invoice.plan || "Subscription";
      const planName = String(rawPlan).charAt(0).toUpperCase() + String(rawPlan).slice(1);
      const rawCycle = invoice.metadata?.billing_cycle || invoice.billing_cycle || "Monthly";
      const cycle = String(rawCycle).charAt(0).toUpperCase() + String(rawCycle).slice(1);
      resolvedItems = [
        {
          name: `${planName} Subscription`,
          details: cycle,
          price: invoice.grand_total || invoice.amount || 0,
        },
      ];
    } else if (resolvedType === "THEME") {
      const rawTheme = invoice.metadata?.theme_name || invoice.theme?.name || "Storefront Theme";
      const themeName = String(rawTheme).charAt(0).toUpperCase() + String(rawTheme).slice(1);
      resolvedItems = [
        {
          name: `${themeName} Storefront Theme`,
          details: "Lifetime License",
          price: invoice.grand_total || invoice.amount || 0,
        },
      ];
    }
  }

  const doc = new PDFDocument({
    margin: 0,
    size: "A4",
    bufferPages: true,
  });

  if (FONT_SERIF_PATH && fs.existsSync(FONT_SERIF_PATH)) doc.registerFont("Lora", FONT_SERIF_PATH);
  if (FONT_REGULAR_PATH && fs.existsSync(FONT_REGULAR_PATH)) doc.registerFont("Inter", FONT_REGULAR_PATH);
  if (FONT_BOLD_PATH && fs.existsSync(FONT_BOLD_PATH)) doc.registerFont("Inter-Bold", FONT_BOLD_PATH);

  const bufferPromise = collectPdfBuffer(doc);

  let y = drawHeader(doc, { salon, type: resolvedType, invoice }, logoBuffer);

  y = drawStatusBadge(doc, y, { invoice });

  y = drawGreeting(doc, y, { customer, salon, type: resolvedType, invoice });

  y = drawInvoiceMeta(doc, y, { invoice });

  y = drawPartiesInfo(doc, y, { salon, customer, type: resolvedType });

  let estTableHeight = 28 + 60;
  doc.font(FONTS.bold).fontSize(13);
  (resolvedItems || []).forEach((item) => {
    const sName = item.service?.name || item.name || "Item";
    const nameHeight = doc.heightOfString(sName, { width: 230 });
    estTableHeight += Math.max(32, nameHeight + 14);
  });

  if (y + estTableHeight > PAGE.height - 110) {
    doc.addPage();
    y = PAGE.marginY;
  }

  y = drawServicesTable(doc, y, { items: resolvedItems, invoice, type: resolvedType });

  if (y + 90 > PAGE.height - 110) {
    doc.addPage();
    y = PAGE.marginY;
  }

  y = drawInfoCards(doc, y, { invoice, booking, type: resolvedType, metadata: invoice.metadata || {} });

  if (y + 30 > PAGE.height - 110) {
    doc.addPage();
    y = PAGE.marginY;
  }

  drawNotice(doc, y);

  const range = doc.bufferedPageRange();
  const lastPage = range.start + range.count - 1;
  doc.switchToPage(lastPage);
  drawFooter(doc, { salon, customer, type: resolvedType });

  doc.end();

  return bufferPromise;
};
