const { invoiceRepository, salonRepository, bookingRepository } = require("../repository");
const { error } = require("../libs");
const pdfGeneratorService = require("./pdf-generator.service");
const uploadService = require("./upload.service");
const { InvoiceType } = require("../models/invoice/invoice-types");
const { BookingSource, BookingStatus } = require("../models/booking/booking-types");
const { PaymentPolicy } = require("../models/salon/salon-types");

const derivePaymentStatus = (paid, total) => {
  if (paid >= total && total > 0) return "PAID";
  if (paid > 0 && paid < total) return "PARTIALLY_PAID";
  return "UNPAID";
};

const generateInvoiceNumber = (prefix, booking) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const bookingId = typeof booking === "object" ? booking?.id : booking;
  const bookingUuid = typeof booking === "object" && booking?.uuid ? booking.uuid.slice(0, 8).toUpperCase() : "";
  return bookingUuid
    ? `${prefix}-${bookingId}-${bookingUuid}-${dateStr}`
    : `${prefix}-${bookingId}-${dateStr}`;
};

const resolveCustomerName = (booking) =>
  booking?.customer?.name || booking?.admin_booking?.name || "Valued Customer";

const resolveCustomerEmail = (booking) =>
  booking?.customer?.email || null;

const resolveCustomerPhone = (booking) =>
  booking?.customer?.phone_number || booking?.admin_booking?.phone || null;

const FOLDER_MAP = {
  [InvoiceType.ENUM.BOOKING]: "invoices/bookings",
  [InvoiceType.ENUM.SUBSCRIPTION]: "invoices/subscriptions",
  [InvoiceType.ENUM.THEME]: "invoices/themes",
};

exports.createBookingInvoice = async (booking, options = {}) => {
  const totalAmount = Number(booking.total_price || 0);

  const isAdminBooking =
    booking.created_by === "admin" ||
    booking.created_by === BookingSource?.ENUM?.ADMIN ||
    booking.is_walk_in === true ||
    Boolean(booking.admin_booking);

  const policy = (booking.payment_policy || "").toLowerCase();

  let paidAmount = Number(booking.amount_paid_online || 0);

  const explicitStatus = options.payment_status?.toUpperCase();

  if (explicitStatus === "PAID") {
    paidAmount = totalAmount;
  } else if (isAdminBooking) {
    if (policy === "full_upfront") {
      paidAmount = totalAmount;
    } else if (policy === "partial_deposit") {
      paidAmount = Math.max(paidAmount, Number(booking.deposit_amount || 0));
    }
  } else {
    if (
      policy === "full_upfront" &&
      booking.status === BookingStatus?.ENUM?.CONFIRMED &&
      (paidAmount > 0 || Number(booking.deposit_amount) >= totalAmount)
    ) {
      paidAmount = totalAmount;
    }
  }

  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const paymentStatus = explicitStatus || derivePaymentStatus(paidAmount, totalAmount);
  const paymentMethod = options.payment_method || (policy === "full_upfront" ? "Full Upfront" : booking.payment_policy || "PAY_AT_VENUE");

  if (paymentStatus !== "PAID") {
    return null;
  }

  const existing = await invoiceRepository.findOne(
    { booking_id: booking.id },
    [],
    {},
    options
  );

  if (existing) {
    if (existing.payment_status !== paymentStatus || Number(existing.amount_paid) !== paidAmount) {
      await invoiceRepository.update({
        payload: {
          amount_paid: paidAmount,
          balance_due: balanceDue,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
        },
        criteria: { id: existing.id },
      });
      existing.amount_paid = paidAmount;
      existing.balance_due = balanceDue;
      existing.payment_status = paymentStatus;
      existing.payment_method = paymentMethod;
    }
    return existing;
  }

  const customerName = resolveCustomerName(booking);
  const customerEmail = resolveCustomerEmail(booking);
  const customerPhone = resolveCustomerPhone(booking);
  const invoiceNumber = generateInvoiceNumber("INV", booking);

  return await invoiceRepository.create(
    {
      invoice_number: invoiceNumber,
      invoice_type: InvoiceType.ENUM.BOOKING,
      booking_id: booking.id,
      salon_id: booking.salon_id,
      grand_total: totalAmount,
      amount_paid: paidAmount,
      balance_due: balanceDue,
      currency: "INR",
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      issued_at: new Date(),
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
    },
    options
  );
};

exports.generateInvoice = async ({ invoiceId }) => {
  const isNumeric = !isNaN(invoiceId) && !isNaN(parseFloat(invoiceId));
  const criteria = isNumeric ? { id: Number(invoiceId) } : { uuid: invoiceId };
  const invoice = await invoiceRepository.findInvoiceWithDetails(criteria);

  if (!invoice) {
    console.error(`[InvoiceService] Invoice #${invoiceId} not found.`);
    return null;
  }

  const salon = invoice.salon || (await salonRepository.findOne({ id: invoice.salon_id }));
  const booking = invoice.booking;

  const customer = booking
    ? {
        name: resolveCustomerName(booking),
        email: resolveCustomerEmail(booking),
        phone: resolveCustomerPhone(booking),
      }
    : {};

  const pdfBuffer = await pdfGeneratorService.generateInvoicePDF({
    invoice,
    booking: booking || {},
    salon: salon || {},
    customer,
    bookingServices: booking?.booking_services || [],
    type: invoice.invoice_type,
  });

  const folder = FOLDER_MAP[invoice.invoice_type] || "invoices";
  let invoiceUrl = null;
  try {
    invoiceUrl = await uploadService.uploadPdfBuffer({
      pdfBuffer,
      filename: `${invoice.invoice_number}.pdf`,
      folder,
    });
    console.log(`[InvoiceService] Uploaded PDF for Invoice #${invoice.id} (${invoice.invoice_type}): ${invoiceUrl}`);
  } catch (uploadErr) {
    console.warn(`[InvoiceService] Could not upload PDF:`, uploadErr?.message || uploadErr);
  }

  if (invoiceUrl) {
    await invoiceRepository.update({
      payload: { invoice_url: invoiceUrl },
      criteria: { id: invoice.id },
    });
    invoice.invoice_url = invoiceUrl;
  }

  return invoice;
};

exports.getInvoices = async ({ salon, query = {} }) => {
  const { uuid } = salon;
  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  const type = query.type || "ALL";
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  const criteria = { salon_id: currentSalon.id };
  if (type && type !== "ALL") {
    criteria.invoice_type = type.toUpperCase();
  }

  const result = await invoiceRepository.findPaginated({
    criteria,
    page,
    limit,
    order: [["created_at", "DESC"]],
  });

  const formattedInvoices = (result.invoices || []).map((inv) => {
    const raw = inv.toJSON ? inv.toJSON() : inv;
    let planDisplay = "—";
    if (raw.invoice_type === InvoiceType.ENUM.SUBSCRIPTION) {
      planDisplay = raw.metadata?.billing_cycle || raw.metadata?.plan || "Plan";
    } else if (raw.invoice_type === InvoiceType.ENUM.THEME) {
      planDisplay = "Lifetime";
    }

    return {
      ...raw,
      amount: raw.grand_total,
      status: raw.payment_status,
      plan: planDisplay,
      date: raw.issued_at || raw.created_at,
    };
  });

  return {
    invoices: formattedInvoices,
    pagination: result.pagination,
  };
};

exports.getInvoiceUrl = async ({ invoiceId }) => {
  const isNumeric = !isNaN(invoiceId) && !isNaN(parseFloat(invoiceId));
  const isUuid =
    typeof invoiceId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);

  const criteria = isUuid
    ? { uuid: invoiceId }
    : isNumeric
    ? { id: Number(invoiceId) }
    : { invoice_number: invoiceId };

  let invoice = await invoiceRepository.findOne(criteria);

  if (!invoice && isNumeric) {
    invoice = await invoiceRepository.findOne({ booking_id: Number(invoiceId) });
  }

  if (!invoice && isUuid) {
    const booking = await bookingRepository.findOne({ uuid: invoiceId });
    if (booking) {
      invoice = await invoiceRepository.findOne({ booking_id: booking.id });
    }
  }

  if (!invoice) {
    throw new error.NotFound("Invoice not found");
  }

  if (!invoice.invoice_url) {
    try {
      const updated = await exports.generateInvoice({ invoiceId: invoice.id });
      if (updated?.invoice_url) {
        return { url: updated.invoice_url };
      }
    } catch (err) {
      console.warn("[InvoiceService] On-demand PDF generation failed:", err.message);
    }
  }

  return { url: invoice.invoice_url || null };
};
