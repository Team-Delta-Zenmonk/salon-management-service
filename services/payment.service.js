const crypto = require("crypto");
const stripe = require("../config/stripe");
const { error } = require("../libs");
const { paymentRepository, bookingRepository, cartRepository } = require("../repository");
const { PaymentStatus } = require("../models/payment/payment-types");
const { BookingStatus } = require("../models/booking/booking-types");

exports.createPaymentIntent = async (payload) => {
  const { booking_id } = payload.body;

  return await paymentRepository.handleManagedTransaction(async (transaction) => {
    const booking = await bookingRepository.findOne(
      { uuid: booking_id },
      [],
      {},
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      },
    );

    if (!booking) {
      throw new error.BadRequest("Booking not found");
    }

    if (booking.status === BookingStatus.ENUM.CONFIRMED) {
      throw new error.BadRequest("Already paid");
    }

    if (booking.status !== BookingStatus.ENUM.PENDING) {
      throw new error.BadRequest("Booking not payable");
    }

    if (booking.expires_at && booking.expires_at < new Date()) {
      throw new error.BadRequest("Booking expired");
    }

    const existingPayment = await paymentRepository.findOne(
      {
        booking_id: booking.id,
        status: PaymentStatus.ENUM.PENDING,
      },
      [],
      {},
      {
        transaction,
      },
    );

    if (existingPayment) {
      return {
        clientSecret: existingPayment.stripe_client_secret,

        paymentId: existingPayment.id,
      };
    }

    const lastAttempt = await paymentRepository.findOne(
      {
        booking_id: booking.id,
      },
      [],
      {},
      {
        order: [["attempt_no", "DESC"]],
        transaction,
      },
    );

    const attemptNo = lastAttempt ? lastAttempt.attempt_no + 1 : 1;

    if (attemptNo > 5) {
      throw new error.BadRequest("Too many payment attempts. Please rebook.");
    }

    const idempotencyKey = crypto.randomUUID();
    const amount = booking.total_price * 100;
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "inr",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          booking_id: booking.id.toString(),
          booking_uuid: booking.uuid,
          attempt_no: attemptNo.toString(),
        },
      },

      {
        idempotencyKey,
      },
    );

    const payment = await paymentRepository.create(
      {
        booking_id: booking.id,
        amount,
        currency: "inr",
        stripe_payment_intent_id: paymentIntent.id,
        stripe_client_secret: paymentIntent.client_secret,
        status: PaymentStatus.ENUM.PENDING,
        attempt_no: attemptNo,
        idempotency_key: idempotencyKey,
      },

      { transaction },
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    };
  });
};

exports.handlePaymentSucceeded = async (paymentIntent) => {
  const payment = await paymentRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
  });

  if (!payment) {
    return;
  }
  if (payment.status === PaymentStatus.ENUM.SUCCEEDED) {
    return;
  }

  await paymentRepository.handleManagedTransaction(async (transaction) => {
    const booking = await bookingRepository.findOne(
      { id: payment.booking_id },
      [],
      {},
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      },
    );

    if (!booking) {
      return;
    }

    await paymentRepository.update({
      payload: {
        status: PaymentStatus.ENUM.SUCCEEDED,

        captured_at: new Date(),
      },
      criteria: {
        id: payment.id,
      },
      options: {
        transaction,
      },
    });

    if (booking.status === BookingStatus.ENUM.PENDING) {
      await bookingRepository.update({
        payload: {
          status: BookingStatus.ENUM.CONFIRMED,
        },
        criteria: {
          id: booking.id,
        },
        options: {
          transaction,
        },
      });
    }

    const cart = await cartRepository.getActiveCartByCustomerId(booking.customer_id);

    if (cart && cart.salon_id === booking.salon_id) {
      await cartRepository.softDelete(
        {
          id: cart.id,
        },

        { transaction },
      );
    }
  });
};

exports.handlePaymentFailed = async (paymentIntent) => {
  const payment = await paymentRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
  });

  if (!payment) {
    return;
  }

  if (payment.status === PaymentStatus.ENUM.FAILED) {
    return;
  }

  await paymentRepository.update({
    payload: {
      status: PaymentStatus.ENUM.FAILED,

      failure_reason: paymentIntent.last_payment_error?.message || null,
    },

    criteria: {
      id: payment.id,
    },
  });
};
