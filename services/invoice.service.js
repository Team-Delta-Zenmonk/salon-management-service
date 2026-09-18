const { invoiceRepository, bookingRepository } = require("../repository");
const { error } = require("../libs");
const pdfGeneratorService = require("./pdf-generator.service");
const mailService = require("./mail.service");
const uploadService = require("./upload.service");
const { buildInvoiceEmailHtml } = require("../templates/invoice-email.template");

const derivePaymentStatus = (paid, total) => {
  if (paid >= total && total > 0) return "PAID";
  if (paid > 0 && paid < total) return "PARTIALLY_PAID";
  return "UNPAID";
};

const generateInvoiceNumber = (bookingId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${dateStr}-${String(bookingId).padStart(4, "0")}`;
};

const resolveCustomerName = (booking) =>
  booking.customer?.name || booking.admin_booking?.name || "Valued Customer";

const resolveCustomerEmail = (booking) =>
  booking.customer?.email || null;

exports.generateAndSendInvoiceForBooking = async ({ bookingId }) => {
  const booking = await bookingRepository.findBookingWithDetails({ id: bookingId });

  if (!booking) {
    console.error(`[InvoiceService] Booking #${bookingId} not found — skipping invoice generation.`);
    return null;
  }

  const totalAmount = Number(booking.total_price || 0);
  const paidAmount = Number(booking.amount_paid_online || 0);
  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const paymentStatus = derivePaymentStatus(paidAmount, totalAmount);
  const paymentMethod = booking.payment_policy || "PAY_AT_VENUE";

  const customerName = resolveCustomerName(booking);
  const customerEmail = resolveCustomerEmail(booking);

  let invoice = await invoiceRepository.findOne({ booking_id: booking.id });
  const invoiceNumber = invoice?.invoice_number || generateInvoiceNumber(booking.id);

  const pdfBuffer = await pdfGeneratorService.generateInvoicePDF({
    invoice: invoice || { invoice_number: invoiceNumber, grand_total: totalAmount, amount_paid: paidAmount, balance_due: balanceDue, currency: "INR", payment_status: paymentStatus, payment_method: paymentMethod },
    booking,
    salon: booking.salon,
    customer: booking.customer || { name: customerName, email: customerEmail },
    bookingServices: booking.booking_services,
  });

  let invoiceUrl = invoice?.invoice_url;
  if (!invoiceUrl) {
    try {
      invoiceUrl = await uploadService.uploadPdfBuffer({
        pdfBuffer,
        filename: `${invoiceNumber}.pdf`,
        folder: "invoices",
      });
      console.log(`[InvoiceService] Uploaded PDF to Cloudinary for Booking #${booking.id}: ${invoiceUrl}`);
    } catch (uploadErr) {
      console.warn(`[InvoiceService] Could not upload PDF to Cloudinary:`, uploadErr.message);
    }
  }

  if (!invoice) {
    invoice = await invoiceRepository.create({
      invoice_number: invoiceNumber,
      booking_id: booking.id,
      salon_id: booking.salon_id,
      grand_total: totalAmount,
      amount_paid: paidAmount,
      balance_due: balanceDue,
      currency: "INR",
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      issued_at: new Date(),
      invoice_url: invoiceUrl,
    });
  } else if (invoiceUrl && !invoice.invoice_url) {
    await invoice.update({ invoice_url: invoiceUrl });
  }

  const isAdminBooking = booking.created_by === "ADMIN" || Boolean(booking.admin_booking);
  if (isAdminBooking) {
    console.log(`[InvoiceService] Booking #${booking.id} created by ADMIN — invoice generated & uploaded (URL: ${invoice.invoice_url}), email skipped.`);
    return invoice;
  }

  if (!customerEmail) {
    console.log(`[InvoiceService] Booking #${booking.id} has no customer email — invoice generated & uploaded (URL: ${invoice.invoice_url}), email skipped.`);
    return invoice;
  }

  const salonName = booking.salon?.name || "salon.com";

  const emailHtml = buildInvoiceEmailHtml({
    customerName,
    salonName,
    invoiceNumber: invoice.invoice_number,
    bookingDate: new Date(booking.booking_date).toLocaleDateString("en-IN"),
    totalAmount: `₹${totalAmount.toFixed(2)}`,
    paymentStatus,
  });

  try {
    await mailService.sendInvoiceMail({
      to: customerEmail,
      subject: `Booking Confirmed & Invoice #${invoice.invoice_number} — ${salonName}`,
      html: emailHtml,
      pdfBuffer,
      filename: `Invoice_${invoice.invoice_number}.pdf`,
    });
    console.log(`[InvoiceService] Sent invoice email to ${customerEmail} for Booking #${booking.id}`);
  } catch (mailErr) {
    console.warn(`[InvoiceService] Failed to send email to ${customerEmail}:`, mailErr.message);
  }

  return invoice;
};

exports.getInvoiceUrl = async ({ bookingId }) => {
  const booking = await bookingRepository.findOne({ uuid: bookingId });
  if (!booking) {
    throw new error.NotFound("Booking not found");
  }

  const invoice = await invoiceRepository.findOne({ booking_id: booking.id });
  if (!invoice) {
    throw new error.NotFound("Invoice not found for this booking");
  }

  return { url: invoice.invoice_url || null };
};
