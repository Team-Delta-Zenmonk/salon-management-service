const { invoiceRepository, bookingRepository } = require("../repository");
const { error } = require("../libs");
const pdfGeneratorService = require("./pdf-generator.service");
const uploadService = require("./upload.service");

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
      invoiceUrl = invoice?.invoice_url || null;
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
  } else if (invoiceUrl) {
    await invoice.update({
      invoice_url: invoiceUrl,
      grand_total: totalAmount,
      amount_paid: paidAmount,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
    });
  }

  console.log(`[InvoiceService] Booking #${booking.id} created by ADMIN — invoice generated & uploaded (URL: ${invoice.invoice_url}).`);

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
