const { SUCCESS } = require("../libs/constants");
const { invoiceService } = require("../services");

exports.getInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoices({
      salon: req.salon,
      query: req.query,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error in controller getInvoices:", error);
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoiceUrl({ invoiceId: req.params.invoiceId });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error downloading invoice PDF:", error);
    next(error);
  }
};
