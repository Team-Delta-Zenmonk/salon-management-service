const { ENUM } = require("../common/enum");

class SalonType extends ENUM {
  static ENUM = {
    UNISEX: "unisex",
    MALE: "male",
    FEMALE: "female",
  };
}

exports.SalonType = SalonType;

class DayOfWeek extends ENUM {
  static ENUM = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
}

exports.DayOfWeek = DayOfWeek;

class PaymentPolicy extends ENUM {
  static ENUM = {
    PAY_AT_VENUE: "pay_at_venue",
    PARTIAL_DEPOSIT: "partial_deposit",
    FULL_UPFRONT: "full_upfront",
  };
}

exports.PaymentPolicy = PaymentPolicy;
