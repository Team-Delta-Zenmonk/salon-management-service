const stripe = require("../config/stripe");
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("../libs/constants");
const { paymentService } = require("../services");

exports.webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(" Webhook signature verification failed:", err.message);
    return res.status(BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await paymentService.handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await paymentService.handlePaymentFailed(event.data.object);
        break;

      default:
        console.log("Unhandled event:", event.type);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(INTERNAL_SERVER_ERROR).json({ error: "Webhook failed" });
  }
};