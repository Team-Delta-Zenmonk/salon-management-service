const stripe = require("../config/stripe");
const { error } = require("../libs");
const { paymentRepository, bookingRepository, cartRepository } = require("../repository");
const { PaymentStatus } = require("../models/payment/payment-types");
const { BookingStatus } = require("../models/booking/booking-types");

exports.createPaymentIntent = async (payload) => {
  const { booking_id } = payload.body;

  const booking = await bookingRepository.findOne({ uuid: booking_id });
  if (!booking) throw new error.BadRequest("Booking not found");

  if (booking.status === BookingStatus.ENUM.CONFIRMED) {
    throw new error.BadRequest("Booking is already confirmed and paid");
  }

  if (booking.status === BookingStatus.ENUM.CANCELLED) {
    throw new error.BadRequest("Booking is cancelled. Please rebook.");
  }

  if (booking.expires_at && booking.expires_at < new Date()) {
    throw new error.BadRequest("Booking expired. Please rebook.");
  }

  const existingPayment = await paymentRepository.findOne({
    booking_id: booking.id,
    status: PaymentStatus.ENUM.PENDING,
  });

  if (existingPayment) {
    return {
      clientSecret: existingPayment.stripe_client_secret,
      paymentId: existingPayment.id,
    };
  }

  const failedAttempts = await paymentRepository.count({
    booking_id: booking.id,
    status: PaymentStatus.ENUM.FAILED,
  });

  if (failedAttempts >= 3) {
    throw new error.BadRequest("Maximum payment attempts exceeded. Please rebook.");
  }

  const amount = booking.total_price * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    automatic_payment_methods: { enabled: true },
    metadata: {
      booking_id: booking.id.toString(),
      uuid: booking.uuid,
    },
  });

  const payment = await paymentRepository.create({
    booking_id: booking.id,
    amount,
    currency: "inr",
    stripe_payment_intent_id: paymentIntent.id,
    stripe_client_secret: paymentIntent.client_secret,
    status: PaymentStatus.ENUM.PENDING,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment.id,
  };
};

exports.handlePaymentSucceeded = async (paymentIntent) => {
  const payment = await paymentRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
  });

  if (!payment) return;

  if (payment.status === PaymentStatus.ENUM.SUCCEEDED) {
    return;
  }

  await paymentRepository.handleManagedTransaction(async (transaction) => {
    const booking = await bookingRepository.findOne({ id: payment.booking_id }, null, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking) return;

    if (booking.status !== BookingStatus.ENUM.PENDING) {
      return;
    }

    if (booking.expires_at && booking.expires_at < new Date()) {
      return;
    }

    await paymentRepository.update({
      payload: { status: PaymentStatus.ENUM.SUCCEEDED },
      criteria: { id: payment.id },
      options: { transaction },
    });

    await bookingRepository.update({
      payload: { status: BookingStatus.ENUM.CONFIRMED },
      criteria: { id: booking.id },
      options: { transaction },
    });

    const cart = await cartRepository.getActiveCartByCustomerId(booking.customer_id, { transaction });

    if (cart) {
      await cartRepository.softDelete({ id: cart.id }, { transaction });
    }
  });
};
exports.handlePaymentFailed = async (paymentIntent) => {
  const payment = await paymentRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
  });

  if (!payment) return;

  if (payment.status === PaymentStatus.ENUM.FAILED) {
    return;
  }

  await paymentRepository.update({
    payload: { status: PaymentStatus.ENUM.FAILED },
    criteria: { id: payment.id },
  });
};
