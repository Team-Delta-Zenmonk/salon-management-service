const PDFDocument = require("pdfkit");


const COLORS = {
  goldBorder: "#D4AF37",
  dark: "#1A1A1A",
  accent: "#8C7A6B",
  tableHeader: "#2C2C2C",
  body: "#444444",
  muted: "#777777",
  lightBg: "#FAFAFA",
  cardBg: "#FFFFFF",
  border: "#E5E5E5",
  policyBg: "#F5F5F0",
  dueBg: "#FEF2F2",
  dueText: "#991B1B",
  green: "#059669",
  white: "#FFFFFF",
};

const FONTS = {
  bold: "Helvetica-Bold",
  regular: "Helvetica",
  oblique: "Helvetica-Oblique",
};

const PAGE = {
  marginX: 35,
  marginY: 25,
  width: 595.28,
  height: 841.89,
};
PAGE.contentWidth = PAGE.width - PAGE.marginX * 2;


const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `INR ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (time) => {
  if (!time) return "N/A";
  return new Date(time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const humanisePaymentMethod = (method) => {
  if (!method) return "Pay at Venue";
  return method
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    return null;
  }
};

const normaliseInput = ({ invoice = {}, booking = {}, salon = {}, customer = {}, bookingServices = [] }) => {
  const subtotal = bookingServices.reduce((acc, item) => acc + Number(item.price || 0), 0) || Number(booking.total_price || invoice.grand_total || 0);
  const grandTotal = Number(invoice.grand_total || booking.total_price || subtotal);
  const amountPaid = Number(invoice.amount_paid || booking.amount_paid_online || 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);
  const discount = Math.max(0, subtotal - grandTotal);
  const tax = Math.round(grandTotal * 0.18);

  return {
    invoice: {
      invoice_number: invoice.invoice_number || "DRAFT",
      payment_status: (invoice.payment_status || "UNPAID").toUpperCase(),
      payment_method: invoice.payment_method || "PAY_AT_VENUE",
      issued_at: invoice.issued_at || new Date(),
      subtotal,
      discount,
      tax,
      grand_total: grandTotal,
      amount_paid: amountPaid,
      balance_due: balanceDue,
    },
    booking: {
      booking_date: booking.booking_date || null,
      booking_start_time: booking.booking_start_time || null,
    },
    salon: {
      name: salon.name || "SALON",
      tagline: salon.about || salon.type || "",
      address: salon.address || null,
      phone: salon.phone || salon.phone_number || null,
      email: salon.email || null,
      logo: salon.logo || null,
      website: salon.website || "www.salon.com",
    },
    customer: {
      name: customer.name || booking.admin_booking?.name || "Valued Customer",
      email: customer.email || booking.admin_booking?.email || null,
      phone_number: customer.phone_number || customer.phone || booking.admin_booking?.phone || null,
    },
    bookingServices,
  };
};

const collectPdfBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });


const drawHeader = (doc, { salon, invoice }, logoBuffer) => {
  let y = PAGE.marginY;
  let textLeft = PAGE.marginX;

  if (logoBuffer) {
    let logoDrawn = false;
    try {
      doc.save();
      try {
        doc.circle(PAGE.marginX + 20, y + 20, 20).clip();
        doc.image(logoBuffer, PAGE.marginX, y, { width: 40, height: 40, fit: [40, 40] });
        logoDrawn = true;
      } finally {
        doc.restore();
      }
    } catch (err) {
      console.warn("[PDFGenerator] Failed to render salon logo in PDF:", err.message);
      logoDrawn = false;
    }
    if (logoDrawn) {
      textLeft += 50;
    }
  }

  doc.fillColor(COLORS.dark).font(FONTS.bold).fontSize(16).text(salon.name.toUpperCase(), textLeft, y);
  y += 20;

  if (salon.tagline) {
    doc.fillColor(COLORS.accent).font(FONTS.bold).fontSize(7.5).text(salon.tagline.toUpperCase(), textLeft, y);
    y += 12;
  }

  doc.fillColor(COLORS.muted).font(FONTS.regular).fontSize(8);
  if (salon.address) {
    doc.text(salon.address, textLeft, y, { width: 250 });
    y += 11;
  }
  const contactText = `Phone: ${salon.phone || "N/A"} | Email: ${salon.email || "N/A"}`;
  doc.text(contactText, textLeft, y);

  const rightWidth = 180;
  const rightX = PAGE.width - PAGE.marginX - rightWidth;

  doc.fillColor(COLORS.accent).font(FONTS.regular).fontSize(20).text("INVOICE", rightX, PAGE.marginY, { align: "right", width: rightWidth });
  doc.fillColor(COLORS.dark).font(FONTS.bold).fontSize(9).text(`#${invoice.invoice_number}`, rightX, PAGE.marginY + 25, { align: "right", width: rightWidth });

  const badgeWidth = 85;
  const badgeHeight = 16;
  const badgeX = PAGE.width - PAGE.marginX - badgeWidth;
  const badgeY = PAGE.marginY + 40;

  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 8).fill(COLORS.dueBg);
  doc.rect(badgeX, badgeY, badgeWidth, badgeHeight).strokeColor("#FCA5A5").lineWidth(0.5).stroke();

  doc
    .fillColor(COLORS.dueText)
    .font(FONTS.bold)
    .fontSize(7)
    .text(invoice.payment_status.replace(/_/g, " "), badgeX, badgeY + 4, { align: "center", width: badgeWidth });

  const dividerY = Math.max(y + 10, PAGE.marginY + 65);
  doc
    .moveTo(PAGE.marginX, dividerY)
    .lineTo(PAGE.width - PAGE.marginX, dividerY)
    .strokeColor(COLORS.goldBorder)
    .lineWidth(1.2)
    .stroke();

  return dividerY + 10;
};

const drawDetailsGrid = (doc, startY, { customer, invoice, booking }) => {
  const boxWidth = (PAGE.contentWidth - 12) / 2;
  const leftX = PAGE.marginX;
  const rightX = PAGE.marginX + boxWidth + 12;
  const boxHeight = 90;

  doc.roundedRect(leftX, startY, boxWidth, boxHeight, 5).fillAndStroke(COLORS.cardBg, COLORS.border);
  doc.roundedRect(rightX, startY, boxWidth, boxHeight, 5).fillAndStroke(COLORS.cardBg, COLORS.border);

  let py = startY + 10;
  doc.fillColor(COLORS.accent).font(FONTS.bold).fontSize(7).text("BILLED TO", leftX + 10, py);
  py += 11;
  doc.fillColor(COLORS.dark)
     .font(FONTS.bold)
     .fontSize(9.5)
     .text(customer.name, leftX + 10, py, {
       width: boxWidth - 20,
       height: 12,
       ellipsis: true,
       lineBreak: false 
     });
  py += 13;
  doc.fillColor(COLORS.muted).font(FONTS.regular).fontSize(8);
  doc.text(`Phone: ${customer.phone_number || "N/A"}`, leftX + 10, py);
  py += 10;
  doc.text(`Email: ${customer.email || "N/A"}`, leftX + 10, py);

  py = startY + 10;
  doc.fillColor(COLORS.accent).font(FONTS.bold).fontSize(7).text("APPOINTMENT DETAILS", rightX + 10, py);
  py += 11;

  const metaRows = [
    ["Invoice Date:", formatDate(invoice.issued_at)],
    ["Booking Date:", formatDate(booking.booking_date)],
    ["Time Slot:", formatTime(booking.booking_start_time)],
    ["Payment Method:", humanisePaymentMethod(invoice.payment_method)],
  ];

  for (const [label, val] of metaRows) {
    doc.fillColor(COLORS.muted).font(FONTS.regular).fontSize(8).text(label, rightX + 10, py);
    doc.fillColor(COLORS.dark).font(FONTS.bold).fontSize(8).text(val, rightX + 10, py, { align: "right", width: boxWidth - 20 });
    py += 11;
  }

  return startY + boxHeight + 12;
};

const drawServicesTable = (doc, startY, bookingServices) => {
  let y = startY;
  const rowHeight = 22;

  doc.roundedRect(PAGE.marginX, y, PAGE.contentWidth, rowHeight, 4).fill(COLORS.tableHeader);

  doc.fillColor(COLORS.white).font(FONTS.bold).fontSize(7.5);
  doc.text("#", PAGE.marginX + 8, y + 6);
  doc.text("SERVICES BOOKED", PAGE.marginX + 30, y + 6);
  doc.text("STAFF ASSIGNED", PAGE.marginX + 230, y + 6);
  doc.text("DURATION", PAGE.marginX + 370, y + 6);
  doc.text("AMOUNT", PAGE.width - PAGE.marginX - 90, y + 6, { align: "right", width: 80 });

  y += rowHeight;

  if (!bookingServices || bookingServices.length === 0) {
    doc.fillColor(COLORS.muted).font(FONTS.oblique).fontSize(8).text("No services recorded.", PAGE.marginX + 30, y + 6);
    return y + 20;
  }

  bookingServices.forEach((bs, idx) => {
    const staffName = bs.staff?.name || [bs.staff?.first_name, bs.staff?.last_name].filter(Boolean).join(" ") || "Assigned Stylist";

    doc.fillColor(COLORS.body).font(FONTS.regular).fontSize(8);
    doc.text(`0${idx + 1}`, PAGE.marginX + 8, y + 6);
    doc.font(FONTS.bold).fillColor(COLORS.dark).text(bs.service?.name || "Service", PAGE.marginX + 30, y + 6, { width: 190 });
    doc.font(FONTS.regular).fillColor(COLORS.accent).text(staffName, PAGE.marginX + 230, y + 6, { width: 130 });
    doc.font(FONTS.regular).fillColor(COLORS.body).text(bs.duration_minutes ? `${bs.duration_minutes} mins` : "-", PAGE.marginX + 370, y + 6);
    doc.font(FONTS.bold).fillColor(COLORS.dark).text(formatCurrency(bs.price), PAGE.width - PAGE.marginX - 90, y + 6, { align: "right", width: 80 });

    y += rowHeight;
    doc.moveTo(PAGE.marginX, y).lineTo(PAGE.width - PAGE.marginX, y).strokeColor("#F0F0F0").lineWidth(0.5).stroke();
  });

  return y + 12;
};

const drawSummaryAndPolicy = (doc, startY, { invoice, salon }) => {
  const leftWidth = 240;
  const rightWidth = 210;
  const rightX = PAGE.width - PAGE.marginX - rightWidth;

  // Left: Salon Policy Box
  doc.roundedRect(PAGE.marginX, startY, leftWidth, 85, 4).fill(COLORS.policyBg);
  doc.rect(PAGE.marginX, startY, 3, 85).fill(COLORS.accent);

  doc.fillColor(COLORS.dark).font(FONTS.bold).fontSize(7.5).text("SALON POLICY & THANK YOU", PAGE.marginX + 10, startY + 8);
  doc
    .fillColor(COLORS.body)
    .font(FONTS.regular)
    .fontSize(8)
    .text(
      `Thank you for choosing ${salon.name || "our salon"}! Please arrive 10 minutes prior to appointments. Free reschedules up to 24 hours prior.`,
      PAGE.marginX + 10,
      startY + 22,
      { width: leftWidth - 20 }
    );

  // Right: Totals Card
  doc.roundedRect(rightX, startY, rightWidth, 115, 5).fillAndStroke(COLORS.cardBg, COLORS.border);

  let py = startY + 8;
  const drawTotRow = (label, val, color = COLORS.dark, isBold = false) => {
    doc.fillColor(COLORS.muted).font(FONTS.regular).fontSize(8).text(label, rightX + 10, py);
    doc
      .fillColor(color)
      .font(isBold ? FONTS.bold : FONTS.regular)
      .fontSize(isBold ? 9 : 8)
      .text(val, rightX + 10, py, { align: "right", width: rightWidth - 20 });
    py += 14;
  };

  drawTotRow("Subtotal", formatCurrency(invoice.subtotal));
  drawTotRow("Discount", `- ${formatCurrency(invoice.discount)}`, COLORS.green);

  doc.moveTo(rightX + 10, py - 3).lineTo(rightX + rightWidth - 10, py - 3).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  drawTotRow("Grand Total", formatCurrency(invoice.grand_total), COLORS.dark, true);

  // Balance Due banner inside Card
  doc.roundedRect(rightX + 6, py, rightWidth - 12, 20, 4).fill(COLORS.dueBg);
  doc.fillColor(COLORS.dueText).font(FONTS.bold).fontSize(8).text("Balance Due", rightX + 12, py + 4);
  doc.fillColor(COLORS.dueText).font(FONTS.bold).fontSize(9).text(formatCurrency(invoice.balance_due), rightX + 12, py + 4, { align: "right", width: rightWidth - 24 });

  return startY + 125;
};

const drawFooter = (doc, endY, { salon }) => {
  const footerY = Math.min(PAGE.height - 35, endY + 20);

  doc.moveTo(PAGE.marginX, footerY).lineTo(PAGE.width - PAGE.marginX, footerY).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  doc
    .fillColor(COLORS.muted)
    .font(FONTS.regular)
    .fontSize(8)
    .text(`Thank you for visiting ${salon.name || "us"}! • ${salon.website || "www.salon.com"}`, PAGE.marginX, footerY + 8, {
      align: "center",
      width: PAGE.contentWidth,
    });
};

exports.generateInvoicePDF = async (rawParams) => {
  const normalized = normaliseInput(rawParams);
  const logoBuffer = await fetchImageBuffer(normalized.salon.logo);

  const doc = new PDFDocument({
    margin: PAGE.marginX,
    size: "A4",
    bufferPages: true,
  });

  const bufferPromise = collectPdfBuffer(doc);

  let y = drawHeader(doc, normalized, logoBuffer);
  y = drawDetailsGrid(doc, y, normalized);
  y = drawServicesTable(doc, y, normalized.bookingServices);
  y = drawSummaryAndPolicy(doc, y, normalized);
  drawFooter(doc, y, normalized);

  doc.end();

  return bufferPromise;
};
