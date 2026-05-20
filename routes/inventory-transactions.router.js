const { inventoryTransactionController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { createTransactionSchema } = require("../schema/inventory-item/create-transaction.schema");
const { updateTransactionSchema } = require("../schema/inventory-item/update-transaction.schema");
const router = require("express").Router();

router.post("/", validate(createTransactionSchema), inventoryTransactionController.createTransaction);
router.get("/", inventoryTransactionController.listTransactions);
router.get("/:uuid", inventoryTransactionController.getTransaction);
router.put("/:uuid", validate(updateTransactionSchema), inventoryTransactionController.updateTransaction);

module.exports = router;
