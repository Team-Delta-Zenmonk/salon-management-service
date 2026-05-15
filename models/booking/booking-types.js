const { ENUM } = require("../common/enum");

class BookingType extends ENUM {
  static ENUM = {
    SINGLE: "single",
    BOOKING: "booking",
  };
}

exports.BookingType = BookingType;

class BookingExecutionMode extends ENUM {
  static ENUM = {
    SEQUENTIAL: "sequential",
    PARALLEL: "parallel",
  };
}

exports.BookingExecutionMode = BookingExecutionMode;

class BookingStatus extends ENUM {
  static ENUM = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
  };
}

exports.BookingStatus = BookingStatus;

class BookingSource extends ENUM {
  static ENUM = {
    CUSTOMER: "CUSTOMER",
    ADMIN: "ADMIN",
  };
}

exports.BookingSource = BookingSource;
