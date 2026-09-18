const router = require("express").Router();
const invoiceController = require("../controllers/invoice.controller");

router.get("/booking/:bookingId/download", invoiceController.downloadInvoicePDF);

module.exports = router;
