const { ENUM } = require("../common/enum");

class ServiceGender extends ENUM {
  static ENUM = {
    UNISEX: "unisex",
    MALE: "male",
    FEMALE: "female",
  };
}

exports.ServiceGender = ServiceGender;

class PriceType extends ENUM {
  static ENUM = {
    FROM: "from",
    FIXED: "fixed",
    FREE: "free",
  };
}

exports.PriceType = PriceType;

class DiscountType extends ENUM {
  static ENUM = {
    PERCENTAGE: "percentage",
    AMOUNT: "amount",
  };
}

exports.DiscountType = DiscountType;
