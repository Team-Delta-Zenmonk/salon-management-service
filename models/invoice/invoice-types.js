const { ENUM } = require("../common/enum");

class InvoiceType extends ENUM {
  static ENUM = {
    BOOKING: "BOOKING",
    SUBSCRIPTION: "SUBSCRIPTION",
    THEME: "THEME",
  };
}

class InvoicePaymentStatus extends ENUM {
  static ENUM = {
    PAID: "PAID",
    PENDING: "PENDING",
    FAILED: "FAILED",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    UNPAID: "UNPAID",
  };
}

class SubscriptionPaymentMethod extends ENUM {
  static ENUM = {
    CARD: "card",
    STRIPE: "stripe",
    MANUAL: "manual",
    UPI: "upi",
  };
}

class SubscriptionDiscountType extends ENUM {
  static ENUM = {
    MANUAL: "manual",
    PERCENTAGE: "percentage",
  };
}

module.exports = {
  InvoiceType,
  InvoicePaymentStatus,
  SubscriptionPaymentMethod,
  SubscriptionDiscountType,
};
