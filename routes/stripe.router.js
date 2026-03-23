const router = require("express").Router();
const { stripeController } = require("../controllers");

router.post( "/webhook",require("express").raw({ type: "application/json" }), stripeController.webhook);

module.exports = router;