const { ENUM } = require("../common/enum");

class ThemeInvoiceStatus extends ENUM {
  static ENUM = {
    PAID: "paid",
    PENDING: "pending",
    FAILED: "failed",
  };
}

exports.ThemeInvoiceStatus = ThemeInvoiceStatus;

class ThemePaymentMethod extends ENUM {
  static ENUM = {
    CARD: "card",
    STRIPE: "stripe",
    MANUAL: "manual",
  };
}

exports.ThemePaymentMethod = ThemePaymentMethod;

