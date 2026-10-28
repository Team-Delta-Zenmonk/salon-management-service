"use strict";

const CURRENCY_CONFIG = {
  INR: {
    code: "INR",
    stripeCode: "inr",
    symbol: "₹",
    country: "IN",
    minChargeAmount: 50.00,
    minServicePrice: 50.00,
    subunits: 100,
    isZeroDecimal: false,
  },
  USD: {
    code: "USD",
    stripeCode: "usd",
    symbol: "$",
    country: "US",
    minChargeAmount: 0.50,
    minServicePrice: 0.50,
    subunits: 100,
    isZeroDecimal: false,
  },
  GBP: {
    code: "GBP",
    stripeCode: "gbp",
    symbol: "£",
    country: "GB",
    minChargeAmount: 0.30,
    minServicePrice: 0.30,
    subunits: 100,
    isZeroDecimal: false,
  },
  EUR: {
    code: "EUR",
    stripeCode: "eur",
    symbol: "€",
    country: "EU",
    minChargeAmount: 0.50,
    minServicePrice: 0.50,
    subunits: 100,
    isZeroDecimal: false,
  },
  AED: {
    code: "AED",
    stripeCode: "aed",
    symbol: "AED ",
    country: "AE",
    minChargeAmount: 2.00,
    minServicePrice: 2.00,
    subunits: 100,
    isZeroDecimal: false,
  },
  CAD: {
    code: "CAD",
    stripeCode: "cad",
    symbol: "CA$",
    country: "CA",
    minChargeAmount: 0.50,
    minServicePrice: 0.50,
    subunits: 100,
    isZeroDecimal: false,
  },
  AUD: {
    code: "AUD",
    stripeCode: "aud",
    symbol: "A$",
    country: "AU",
    minChargeAmount: 0.50,
    minServicePrice: 0.50,
    subunits: 100,
    isZeroDecimal: false,
  },
  JPY: {
    code: "JPY",
    stripeCode: "jpy",
    symbol: "¥",
    country: "JP",
    minChargeAmount: 50,
    minServicePrice: 50,
    subunits: 1,
    isZeroDecimal: true,
  },
};

const DEFAULT_CURRENCY = "INR";

function getCurrencyConfig(currencyCode) {
  const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase().trim();
  return CURRENCY_CONFIG[code] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
}

function toStripeAmount(amountInMajor, currencyCode) {
  const config = getCurrencyConfig(currencyCode);
  return Math.round(Number(amountInMajor || 0) * config.subunits);
}

function fromStripeAmount(amountInMinor, currencyCode) {
  const config = getCurrencyConfig(currencyCode);
  return Number(amountInMinor || 0) / config.subunits;
}

module.exports = {
  CURRENCY_CONFIG,
  DEFAULT_CURRENCY,
  getCurrencyConfig,
  toStripeAmount,
  fromStripeAmount,
};
