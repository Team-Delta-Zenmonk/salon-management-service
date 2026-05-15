const stripe = require("../config/stripe");

const { paymentRepository, bookingRepository } = require("../repository");

const { PaymentStatus } = require("../models/payment/payment-types");
const { BookingStatus } = require("../models/booking/booking-types");

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
        console.log("⚡ Fixing SUCCESS mismatch:", payment.id);

        await paymentRepository.handleManagedTransaction(async (transaction) => {
          const booking = await bookingRepository.findOne({ id: payment.booking_id }, null, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!booking) return;

          await paymentRepository.update({
            payload: {
              status: PaymentStatus.ENUM.SUCCEEDED,
              captured_at: new Date(),
            },
            criteria: { id: payment.id },
            options: { transaction },
          });

          if (booking.status === BookingStatus.ENUM.PENDING) {
            await bookingRepository.update({
              payload: { status: BookingStatus.ENUM.CONFIRMED },
              criteria: { id: booking.id },
              options: { transaction },
            });
          }
        });
      }

      if (intent.status === "requires_payment_method") {
        console.log("Fixing FAILED mismatch:", payment.id);

        await paymentRepository.update({
          payload: {
            status: PaymentStatus.ENUM.FAILED,
          },
          criteria: { id: payment.id },
        });
      }
    } catch (err) {
      console.error("Reconciliation error for payment:", payment.id, err.message);
    }
  }

  console.log("✅ [Reconciliation] Completed");
};
