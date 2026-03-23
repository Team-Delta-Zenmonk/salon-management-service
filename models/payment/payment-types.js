const { ENUM } = require("../common/enum");

class PaymentStatus extends ENUM {
  static ENUM = {
    PENDING: "pending",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
  };
}

exports.PaymentStatus = PaymentStatus;
