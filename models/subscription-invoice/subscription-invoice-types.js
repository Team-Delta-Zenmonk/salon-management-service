const { ENUM } = require("../common/enum");

class SubscriptionInvoiceStatus extends ENUM {
  static ENUM = {
    PAID: "paid",
    PENDING: "pending",
    FAILED: "failed",
  };
}

exports.SubscriptionInvoiceStatus = SubscriptionInvoiceStatus;

class SubscriptionBillingCycle extends ENUM {
  static ENUM = {
    MONTHLY: "monthly",
    YEARLY: "yearly",
  };
}

exports.SubscriptionBillingCycle = SubscriptionBillingCycle;

class SubscriptionPaymentMethod extends ENUM {
  static ENUM = {
    CARD: "card",
    STRIPE: "stripe",
    MANUAL: "manual",
  };
}

exports.SubscriptionPaymentMethod = SubscriptionPaymentMethod;

class SubscriptionDiscountType extends ENUM {
  static ENUM = {
    MANUAL: "manual",
    PERCENTAGE: "percentage",
  };
}

exports.SubscriptionDiscountType = SubscriptionDiscountType;
