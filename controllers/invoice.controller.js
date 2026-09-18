const { SUCCESS } = require("../libs/constants");
const { invoiceService } = require("../services");

exports.downloadInvoicePDF = async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoiceUrl({ bookingId: req.params.bookingId });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error downloading invoice PDF:", error);
    next(error);
  }
};
