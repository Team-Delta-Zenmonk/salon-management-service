const { DiscountType } = require("../models/service/service-types");

const calculateFinalPrice = ({ basePrice, discount, discountType }) => {
  if (!discount || !discountType) {
    return basePrice;
  }

  if (discountType === DiscountType.ENUM.PERCENTAGE) {
    return Math.round(basePrice - (basePrice * discount) / 100);
  }

  if (discountType === DiscountType.ENUM.AMOUNT) {
    return Math.max(basePrice - discount, 0);
  }

  return basePrice;
};

module.exports = {
  calculateFinalPrice,
};
