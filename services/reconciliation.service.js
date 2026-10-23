const stripe = require("../config/stripe");
const { paymentRepository } = require("../repository");
const { PaymentStatus } = require("../models/payment/payment-types");
const paymentService = require("./payment.service");

exports.reconcilePayments = async () => {
  console.log("🔄 [Reconciliation] Started");

  const pendingPayments = await paymentRepository.findAll({
    criteria: {
      status: PaymentStatus.ENUM.PENDING,
    },
    limit: 50,
  });

  for (const payment of pendingPayments) {
    try {
      const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      if (intent.status === "succeeded") {
        console.log("⚡ Fixing SUCCESS mismatch via handlePaymentSucceeded:", payment.id);
        await paymentService.handlePaymentSucceeded(intent);
      } else if (intent.status === "requires_payment_method" || intent.status === "canceled") {
        console.log("Fixing FAILED mismatch:", payment.id);
        await paymentService.handlePaymentFailed(intent);
      }
    } catch (err) {
      console.error("Reconciliation error for payment:", payment.id, err.message);
    }
  }

  console.log("✅ [Reconciliation] Completed");
};
