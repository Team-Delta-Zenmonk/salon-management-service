const router = require("express").Router();
const invoiceController = require("../controllers/invoice.controller");
const { authSalonMiddleware } = require("../middlewares/auth.middleware");

router.get("/", authSalonMiddleware, invoiceController.getInvoices);

router.get("/:invoiceId/download", invoiceController.downloadInvoice);

router.get("/booking/:bookingId/download", (req, res, next) => {
  req.params.invoiceId = req.params.bookingId;
  return invoiceController.downloadInvoice(req, res, next);
});

module.exports = router;
