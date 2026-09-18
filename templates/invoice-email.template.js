exports.buildInvoiceHtml = ({
  invoice,
  booking,
  salon,
  customer,
  bookingServices = [],
}) => {
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const servicesRows = bookingServices.length
    ? bookingServices
        .map(
          (s, idx) => {
            const staffName = s.staff?.name || [s.staff?.first_name, s.staff?.last_name].filter(Boolean).join(" ") || "Assigned Stylist";
            return `
      <tr>
        <td class="text-center" style="color: #888;">0${idx + 1}</td>
        <td>
          <strong style="color: #1A1A1A;">${s.service?.name || "Service"}</strong>
        </td>
        <td><span class="stylist-tag">${staffName}</span></td>
        <td class="text-center">${s.duration_minutes ? `${s.duration_minutes} mins` : "-"}</td>
        <td class="text-right" style="font-weight: 600;">${formatCurrency(s.price)}</td>
      </tr>`;
          }
        )
        .join("")
    : `<tr><td colspan="5" style="text-align:center; color:#888;">No services recorded.</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 18mm 16mm;
    background-color: #FAFAFA;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #2C2C2C;
    margin: 0;
    padding: 0;
    font-size: 10pt;
    line-height: 1.5;
  }
  
  /* Header Section */
  .header {
    display: table;
    width: 100%;
    border-bottom: 2px solid #D4AF37;
    padding-bottom: 20px;
    margin-bottom: 25px;
  }
  .brand-col {
    display: table-cell;
    vertical-align: top;
    width: 60%;
  }
  .invoice-col {
    display: table-cell;
    vertical-align: top;
    text-align: right;
    width: 40%;
  }
  .salon-name {
    font-size: 20pt;
    font-weight: 700;
    letter-spacing: 2px;
    color: #1A1A1A;
    text-transform: uppercase;
    margin: 0 0 4px 0;
  }
  .salon-tagline {
    font-size: 8.5pt;
    color: #8C7A6B;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .salon-contact {
    font-size: 8.5pt;
    color: #666;
    line-height: 1.4;
  }
  
  .inv-title {
    font-size: 24pt;
    font-weight: 300;
    letter-spacing: 3px;
    color: #8C7A6B;
    margin: 0 0 6px 0;
    text-transform: uppercase;
  }
  .inv-num {
    font-size: 10pt;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    background-color: #FEE2E2;
    color: #991B1B;
    border: 1px solid #FCA5A5;
  }

  /* Details Grid */
  .details-grid {
    display: table;
    width: 100%;
    margin-bottom: 30px;
    background: #FFFFFF;
    border-radius: 8px;
    border: 1px solid #E5E5E5;
    padding: 16px;
  }
  .client-box {
display: table-cell;
  width: 50%;
  vertical-align: top;
  padding-right: 15px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  }
  .meta-box {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    border-left: 1px solid #F0F0F0;
    padding-left: 20px;
  }
  .sec-heading {
    font-size: 8pt;
    font-weight: 700;
    color: #8C7A6B;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
  }
  .client-name {
    font-size: 12pt;
    font-weight: 700;
    color: #1A1A1A;
    margin-bottom: 4px;
    word-break: break-word;
  }
  .meta-row {
    display: table;
    width: 100%;
    font-size: 9pt;
    margin-bottom: 4px;
  }
  .meta-label {
    display: table-cell;
    color: #777;
    width: 45%;
  }
  .meta-val {
    display: table-cell;
    font-weight: 600;
    color: #222;
    text-align: right;
  }

  /* Table */
  .table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
    background: #FFFFFF;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #E5E5E5;
  }
  .table th {
    background-color: #2C2C2C;
    color: #FFFFFF;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 12px 14px;
    text-align: left;
  }
  .table td {
    padding: 12px 14px;
    border-bottom: 1px solid #F0F0F0;
    font-size: 9.5pt;
    color: #444;
  }
  .table tr:last-child td {
    border-bottom: none;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .stylist-tag {
    font-size: 8pt;
    color: #8C7A6B;
    font-weight: 500;
  }

  /* Totals & Summary */
  .summary-wrapper {
    display: table;
    width: 100%;
    margin-top: 10px;
  }
  .notes-col {
    display: table-cell;
    width: 55%;
    vertical-align: top;
    padding-right: 25px;
  }
  .totals-col {
    display: table-cell;
    width: 45%;
    vertical-align: top;
  }
  .totals-card {
    background: #FFFFFF;
    border: 1px solid #E5E5E5;
    border-radius: 8px;
    padding: 16px;
  }
  .tot-row {
    display: table;
    width: 100%;
    margin-bottom: 8px;
    font-size: 9.5pt;
  }
  .tot-label { display: table-cell; color: #666; }
  .tot-val { display: table-cell; text-align: right; font-weight: 600; color: #222; }
  .tot-divider { border-top: 1px solid #E5E5E5; margin: 8px 0; }
  .grand-tot {
    font-size: 12pt;
    font-weight: 700;
    color: #1A1A1A;
  }
  .due-row {
    background-color: #FEF2F2;
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 8px;
    color: #991B1B;
  }
  .due-row .tot-label { color: #991B1B; font-weight: 600; }
  .due-row .tot-val { color: #991B1B; font-weight: 700; font-size: 11pt; }

  .policy-box {
    background-color: #F5F5F0;
    border-left: 3px solid #8C7A6B;
    padding: 12px;
    border-radius: 0 6px 6px 0;
    font-size: 8.5pt;
    color: #555;
  }
  .policy-title {
    font-weight: 700;
    color: #2C2C2C;
    margin-bottom: 4px;
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.5px;
  }

  /* Footer */
  .footer {
    margin-top: 40px;
    text-align: center;
    border-top: 1px solid #E5E5E5;
    padding-top: 15px;
    font-size: 8.5pt;
    color: #888;
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="brand-col">
      ${salon.logo ? `<img src="${salon.logo}" alt="Logo" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; margin-bottom: 8px; border: 1px solid #E5E5E5;" />` : ""}
      <div class="salon-name">${salon.name || "SALON"}</div>
      <div class="salon-tagline">${salon.about || salon.type || salon.tagline || ""}</div>
      <div class="salon-contact">
        ${salon.address || ""}<br>
        Phone: ${salon.phone || salon.phone_number || "N/A"} | Email: ${salon.email || "N/A"}
      </div>
    </div>
    <div class="invoice-col">
      <div class="inv-title">INVOICE</div>
      <div class="inv-num">#${invoice.invoice_number || "DRAFT"}</div>
      <span class="badge">${invoice.payment_status || "UNPAID"}</span>
    </div>
  </div>

  <!-- Appointment & Billing Details -->
  <div class="details-grid">
    <div class="client-box">
      <div class="sec-heading">Billed To</div>
      <div class="client-name">${customer.name || "Valued Customer"}</div>
      <div style="color: #666; font-size: 9pt; line-height: 1.4;">
        Phone: ${customer.phone_number || "N/A"}<br>
        Email: ${customer.email || "N/A"}
      </div>
    </div>
    <div class="meta-box">
      <div class="sec-heading">Appointment Details</div>
      <div class="meta-row">
        <span class="meta-label">Invoice Date:</span>
        <span class="meta-val">${invoice.issued_at || "N/A"}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Booking Date:</span>
        <span class="meta-val">${booking.booking_date || "N/A"}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Time Slot:</span>
        <span class="meta-val">${booking.booking_start_time || "N/A"}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Payment Method:</span>
        <span class="meta-val">${invoice.payment_method || "Pay at Venue"}</span>
      </div>
    </div>
  </div>

  <!-- Services Table -->
  <table class="table">
    <thead>
      <tr>
        <th style="width: 8%; text-align: center;">#</th>
        <th style="width: 42%;">Services Booked</th>
        <th style="width: 25%;">Staff Assigned</th>
        <th style="width: 10%; text-align: center;">Duration</th>
        <th style="width: 15%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${servicesRows}
    </tbody>
  </table>

  <!-- Policy Notes & Calculations -->
  <div class="summary-wrapper">
    <div class="notes-col">
      <div class="policy-box">
        <div class="policy-title">Salon Policy & Thank You</div>
        Thank you for choosing ${salon.name || "our salon"}! Please arrive 10 minutes prior to appointments. Free reschedules up to 24 hours prior.
      </div>
    </div>
    <div class="totals-col">
      <div class="totals-card">
        <div class="tot-row">
          <span class="tot-label">Subtotal</span>
          <span class="tot-val">${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="tot-row">
          <span class="tot-label">Discount</span>
          <span class="tot-val" style="color: #059669;">- ${formatCurrency(invoice.discount)}</span>
        </div>
        <div class="tot-divider"></div>
        <div class="tot-row grand-tot">
          <span class="tot-label" style="color: #1A1A1A; font-weight: 700;">Grand Total</span>
          <span class="tot-val" style="color: #1A1A1A;">${formatCurrency(invoice.grand_total)}</span>
        </div>
        <div class="tot-row due-row">
          <span class="tot-label">Balance Due</span>
          <span class="tot-val">${formatCurrency(invoice.balance_due)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Thank you for visiting ${salon.name || "us"}! • ${salon.website || "www.salon.com"}
  </div>

</body>
</html>
  `.trim();
};

exports.buildInvoiceEmailHtml = exports.buildInvoiceHtml;