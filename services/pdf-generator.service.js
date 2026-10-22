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

const fitText = (doc, text, maxWidth, options = {}) => {
  if (!text) return "";
  const str = String(text).replace(/[\r\n]+/g, " ").trim();
  if (maxWidth <= 0) return "";
  if (doc.widthOfString(str, options) <= maxWidth) return str;
  const ellipsis = "...";
  const ellipsisWidth = doc.widthOfString(ellipsis, options);
  if (ellipsisWidth >= maxWidth) return "";
  let low = 0;
  let high = str.length;
  let best = "";
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = str.slice(0, mid);
    if (doc.widthOfString(candidate, options) + ellipsisWidth <= maxWidth) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best ? `${best.trimEnd()}${ellipsis}` : ellipsis;
};

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
    .fontSize(28);

  const truncatedHeader = fitText(doc, headerTitle, maxHeaderWidth, { characterSpacing: 0.5 });
  doc.text(truncatedHeader, textLeft, y + 3, {
    width: maxHeaderWidth,
    lineBreak: false,
    characterSpacing: 0.5,
  });

  const bannerY = y + logoSize + 14;
  const bannerHeight = 50;
  doc.roundedRect(PAGE.marginX, bannerY, PAGE.contentWidth, bannerHeight, 6).fill(COLORS.primaryOrange);

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
    .fontSize(22);

  const truncatedBanner = fitText(doc, bannerText, maxBannerWidth);
  doc.text(truncatedBanner, PAGE.marginX + 16, bannerY + 14, {
    width: maxBannerWidth,
    lineBreak: false,
  });

  return bannerY + bannerHeight + 20;
};

const drawFooter = (doc, { salon, customer, type }) => {
  const footerStartY = PAGE.height - 90;

  doc
    .moveTo(PAGE.marginX, footerStartY)
    .lineTo(PAGE.width - PAGE.marginX, footerStartY)
    .strokeColor(COLORS.border)
    .lineWidth(0.75)
    .stroke();

  let line1 = `Questions about your receipt? Reach out to ${process.env.SUPPORT_EMAIL || "support@zenmonk.tech"}.`;
  if (type === "BOOKING") {
    const contactParts = [];
    if (salon.email) contactParts.push(salon.email);
    if (salon.phone || salon.phone_number) contactParts.push(`call ${salon.phone || salon.phone_number}`);
    const contactStr = contactParts.length > 0 ? `Reach out to ${contactParts.join(" or ")}.` : "";
    line1 = `Questions about your receipt? ${contactStr}`;
  }

  doc
    .fillColor(COLORS.footerDark)
    .font(FONTS.regular)
    .fontSize(14);

  const truncatedLine1 = fitText(doc, line1, PAGE.contentWidth);
  doc.text(truncatedLine1, PAGE.marginX, footerStartY + 10, {
    width: PAGE.contentWidth,
    lineBreak: false,
  });

  const recipientEmail =
    type === "BOOKING" ? (customer.email || "") : (salon.email || "");
  const line2 = recipientEmail
    ? `This automated receipt was sent to ${recipientEmail}. Please do not reply.`
    : "This is an automated invoice. Please do not reply.";

  doc
    .fillColor(COLORS.mutedText)
    .font(FONTS.regular)
    .fontSize(12);

  const truncatedLine2 = fitText(doc, line2, PAGE.contentWidth);
  doc.text(truncatedLine2, PAGE.marginX, footerStartY + 30, {
    width: PAGE.contentWidth,
    lineBreak: false,
  });
};

const drawStatusBadge = (doc, startY, { invoice }) => {
  const cardHeight = 48;
  const isUnpaid = invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED";
  const bg = isUnpaid ? COLORS.peachBg : COLORS.successBg;

  doc.roundedRect(PAGE.marginX, startY, PAGE.contentWidth, cardHeight, 6).fill(bg);

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

  const badgeText = isUnpaid
    ? `Pending / Unpaid: ${formatCurrency(invoice.grand_total || invoice.amount)}`
    : `Successfully paid: ${formatCurrency(invoice.grand_total || invoice.amount)}.`;

  const textX = PAGE.marginX + 16 + iconRadius * 2 + 12;
  const maxBadgeWidth = PAGE.contentWidth - (textX - PAGE.marginX) - 16;
  doc
    .fillColor(COLORS.darkText)
    .font(FONTS.bold)
    .fontSize(16);

  const truncatedBadge = fitText(doc, badgeText, maxBadgeWidth);
  doc.text(truncatedBadge, textX, startY + 15, {
    width: maxBadgeWidth,
    lineBreak: false,
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

  const truncatedTitle = fitText(doc, title, PAGE.contentWidth);
  doc.text(truncatedTitle, PAGE.marginX, startY, {
    width: PAGE.contentWidth,
    lineBreak: false,
  });

  const subtitleY = startY + 24 + 14;

  doc
    .fillColor(COLORS.bodyText)
    .font(FONTS.regular)
    .fontSize(16);

  const truncatedSubtitle = fitText(doc, subtitle, PAGE.contentWidth, { characterSpacing: 0.2 });
  doc.text(truncatedSubtitle, PAGE.marginX, subtitleY, {
    width: PAGE.contentWidth,
    lineBreak: false,
    characterSpacing: 0.2,
  });

  return subtitleY + 20 + 20;
};

const drawInvoiceMeta = (doc, startY, { invoice }) => {
  let y = startY;
  const colWidth = (PAGE.contentWidth - 20) / 2;
  const rightX = PAGE.width - PAGE.marginX - colWidth;

  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text("INVOICE NUMBER:", PAGE.marginX, y, { characterSpacing: 0.6 });
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text("INVOICE DATE:", rightX, y, { align: "right", width: colWidth, characterSpacing: 0.6 });

  y += 16;

  doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
  const truncatedNum = fitText(doc, invoice.invoice_number || "", colWidth);
  doc.text(truncatedNum, PAGE.marginX, y, { width: colWidth, lineBreak: false });

  const dateStr = formatDate(invoice.issued_at || invoice.created_at);
  const truncatedDate = fitText(doc, dateStr, colWidth);
  doc.text(truncatedDate, rightX, y, { align: "right", width: colWidth, lineBreak: false });

  y += 20;

  doc.moveTo(PAGE.marginX, y).lineTo(PAGE.width - PAGE.marginX, y).strokeColor(COLORS.border).lineWidth(0.75).stroke();

  return y + 16;
};

const drawPartiesInfo = (doc, startY, { salon = {}, customer = {}, type }) => {
  const colWidth = (PAGE.contentWidth - 24) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + colWidth + 24;

  const leftLabel = type === "BOOKING" ? "SALON:" : "BILLED BY:";
  const rightLabel = type === "BOOKING" ? "CUSTOMER:" : "BILLED TO:";

  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text(leftLabel, leftX, startY, { characterSpacing: 0.6 });
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(12).text(rightLabel, rightX, startY, { align: "right", width: colWidth, characterSpacing: 0.6 });

  let sy = startY + 16;
  let cy = startY + 16;

  if (type === "BOOKING") {
    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
    doc.text(fitText(doc, salon.name || "Salon", colWidth), leftX, sy, { width: colWidth, lineBreak: false });
    sy += 16;
    doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
    if (salon.address) {
      doc.text(fitText(doc, salon.address, colWidth), leftX, sy, { width: colWidth, lineBreak: false });
      sy += 16;
    }
    const cityState = [salon.city, salon.state, salon.zip_code].filter(Boolean).join(", ");
    if (cityState) {
      doc.text(fitText(doc, cityState, colWidth), leftX, sy, { width: colWidth, lineBreak: false });
      sy += 16;
    }

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
    doc.text(fitText(doc, customer.name || "Customer", colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
    cy += 16;
    doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
    if (customer.email) {
      doc.text(fitText(doc, customer.email, colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
      cy += 16;
    }
    if (customer.phone) {
      doc.text(fitText(doc, customer.phone, colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
      cy += 16;
    }
  } else {
    const brandName = process.env.BRAND_NAME || "Vellora";
    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
    doc.text(fitText(doc, brandName, colWidth), leftX, sy, { width: colWidth, lineBreak: false });
    sy += 16;
    doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
    doc.text("Cloud Salon Software Suite", leftX, sy, { width: colWidth, lineBreak: false });
    sy += 16;
    doc.text(fitText(doc, process.env.SUPPORT_EMAIL || "support@zenmonk.tech", colWidth), leftX, sy, { width: colWidth, lineBreak: false });
    sy += 16;

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
    doc.text(fitText(doc, salon.name || "Salon Partner", colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
    cy += 16;
    doc.fillColor(COLORS.darkText).font(FONTS.regular).fontSize(14);
    if (salon.email) {
      doc.text(fitText(doc, salon.email, colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
      cy += 16;
    }
    if (salon.phone || salon.phone_number) {
      doc.text(fitText(doc, salon.phone || salon.phone_number, colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
      cy += 16;
    }
    if (salon.address) {
      doc.text(fitText(doc, salon.address, colWidth), rightX, cy, { align: "right", width: colWidth, lineBreak: false });
      cy += 16;
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
    const rowHeight = 32;

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
    const truncatedName = fitText(doc, sName, descColWidth);
    doc.text(truncatedName, tableLeft, y + 7, {
      width: descColWidth,
      lineBreak: false,
    });

    doc.fillColor(COLORS.bodyText).font(FONTS.regular).fontSize(14);
    const truncatedQty = fitText(doc, sQty, qtyColWidth);
    doc.text(truncatedQty, qtyColX, y + 7, {
      width: qtyColWidth,
      align: "center",
      lineBreak: false,
    });

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
    const truncatedPrice = fitText(doc, sPrice, priceColWidth);
    doc.text(truncatedPrice, priceColX, y + 7, {
      width: priceColWidth,
      align: "right",
      lineBreak: false,
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

  doc.fillColor(COLORS.bodyText).font(FONTS.regular).fontSize(14).text("Subtotal:", totalsLabelX, totalsY, {
    width: totalsLabelWidth,
    align: "right",
  });
  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(14);
  const truncatedSubtotal = fitText(doc, formatCurrency(grandTotal), totalsPriceWidth);
  doc.text(truncatedSubtotal, totalsPriceX, totalsY, {
    width: totalsPriceWidth,
    align: "right",
    lineBreak: false,
  });

  totalsY += 22;

  const isUnpaid = invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED";
  const totalLabel = isUnpaid ? "Total due:" : "Total paid:";
  const totalColor = isUnpaid ? COLORS.darkText : COLORS.successText;

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(16).text(totalLabel, totalsLabelX, totalsY, {
    width: totalsLabelWidth,
    align: "right",
  });
  doc.fillColor(totalColor).font(FONTS.bold).fontSize(18);
  const truncatedGrandTotal = fitText(doc, formatCurrency(grandTotal), totalsPriceWidth);
  doc.text(truncatedGrandTotal, totalsPriceX, totalsY, {
    width: totalsPriceWidth,
    align: "right",
    lineBreak: false,
  });

  const totalTableHeight = totalsY + 28 - startTableY;
  doc.roundedRect(PAGE.marginX, startTableY, PAGE.contentWidth, totalTableHeight, 6).strokeColor(COLORS.border).lineWidth(0.75).stroke();

  return startTableY + totalTableHeight + 18;
};

const drawInfoCards = (doc, startY, { invoice, booking = {}, type, metadata = {} }) => {
  const cardWidth = (PAGE.contentWidth - 12) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + cardWidth + 12;
  const cardHeight = 76;
  const maxInnerWidth = cardWidth - 32;

  const isUnpaid = invoice.payment_status === "UNPAID" || invoice.payment_status === "FAILED";

  doc.roundedRect(leftX, startY, cardWidth, cardHeight, 6).fill(COLORS.peachBg);
  doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("PAYMENT STATUS:", leftX + 16, startY + 12, { characterSpacing: 0.6 });

  const statusTitle = isUnpaid ? "Payment Pending" : "Paid";
  const statusSub = isUnpaid ? "Payment due" : `Paid on ${formatDate(invoice.issued_at || invoice.created_at)}.`;
  const subColor = isUnpaid ? COLORS.mutedText : COLORS.successText;

  doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
  doc.text(fitText(doc, statusTitle, maxInnerWidth), leftX + 16, startY + 28, {
    width: maxInnerWidth,
    lineBreak: false,
  });

  doc.fillColor(subColor).font(FONTS.regular).fontSize(12);
  doc.text(fitText(doc, statusSub, maxInnerWidth), leftX + 16, startY + 48, {
    width: maxInnerWidth,
    lineBreak: false,
  });

  doc.roundedRect(rightX, startY, cardWidth, cardHeight, 6).fill(COLORS.peachBg);

  if (type === "BOOKING") {
    doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("APPOINTMENT:", rightX + 16, startY + 12, { characterSpacing: 0.6 });
    const apptTime = formatAppointmentTime(booking.booking_start_time || booking.booking_date);
    const durationStr = formatDuration(booking.total_duration);

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
    doc.text(fitText(doc, apptTime, maxInnerWidth), rightX + 16, startY + 28, {
      width: maxInnerWidth,
      lineBreak: false,
    });
    if (durationStr) {
      doc.fillColor(COLORS.mutedText).font(FONTS.regular).fontSize(12);
      doc.text(fitText(doc, durationStr, maxInnerWidth), rightX + 16, startY + 48, {
        width: maxInnerWidth,
        lineBreak: false,
      });
    }
  } else if (type === "SUBSCRIPTION") {
    doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("VALIDITY & ACCESS:", rightX + 16, startY + 12, { characterSpacing: 0.6 });
    const cycle = metadata.billing_cycle || invoice.billing_cycle || "Monthly";
    const end = metadata.billing_period_end ? formatDate(metadata.billing_period_end) : "Active";
    const formattedCycle = cycle ? cycle.charAt(0).toUpperCase() + cycle.slice(1) : "Monthly";

    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(12.5);
    doc.text(fitText(doc, `Valid to: ${end}`, maxInnerWidth), rightX + 16, startY + 28, {
      width: maxInnerWidth,
      lineBreak: false,
    });
    doc.fillColor(COLORS.mutedText).font(FONTS.regular).fontSize(12);
    doc.text(fitText(doc, `Billing Cycle: ${formattedCycle}`, maxInnerWidth), rightX + 16, startY + 48, {
      width: maxInnerWidth,
      lineBreak: false,
    });
  } else {
    doc.fillColor(COLORS.mutedText).font(FONTS.bold).fontSize(11).text("LICENSE TYPE:", rightX + 16, startY + 12, { characterSpacing: 0.6 });
    doc.fillColor(COLORS.darkText).font(FONTS.bold).fontSize(13);
    doc.text(fitText(doc, "Lifetime Access", maxInnerWidth), rightX + 16, startY + 28, {
      width: maxInnerWidth,
      lineBreak: false,
    });
    doc.fillColor(COLORS.mutedText).font(FONTS.regular).fontSize(12);
    doc.text(fitText(doc, "Unlimited storefront usage", maxInnerWidth), rightX + 16, startY + 48, {
      width: maxInnerWidth,
      lineBreak: false,
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

  if (y + 110 > PAGE.height - 100) {
    doc.addPage();
    y = PAGE.marginY;
  }

  y = drawServicesTable(doc, y, { items: resolvedItems, invoice, type: resolvedType });

  if (y + 76 > PAGE.height - 100) {
    doc.addPage();
    y = PAGE.marginY;
  }

  y = drawInfoCards(doc, y, { invoice, booking, type: resolvedType, metadata: invoice.metadata || {} });

  if (y + 24 > PAGE.height - 100) {
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
