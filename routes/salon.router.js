const router = require('express').Router();
const { authMiddleware } = require('../middlewares');
const { salonController, themeController, invoiceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const { getSalonSchema } = require('../schema/salon/get-salon.schema');
const { listSalonsSchema } = require('../schema/salon/list-salons.schema');
const { updateSalonSchema } = require('../schema/salon/update-salon.schema');
const { checkSlugSchema } = require('../schema/salon/check-slug.schema');
const { upgradeSubscriptionSchema } = require('../schema/salon/upgrade-subscription.schema');
const { subscriptionIntentSchema } = require('../schema/salon/subscription-intent.schema');
const { activateThemeSchema } = require('../schema/theme/theme.schema');

router.get('/', validate(listSalonsSchema), salonController.listSalons);
router.get("/check-slug/:slug", authMiddleware.optionalAuthSalonMiddleware, validate(checkSlugSchema), salonController.checkSlugAvailability);
router.get("/subscription/invoices", authMiddleware.authSalonMiddleware, (req, res, next) => {
  req.query.type = "SUBSCRIPTION";
  return invoiceController.getInvoices(req, res, next);
});
router.get("/:uuid", validate(getSalonSchema), salonController.getSalon);
router.put('/', authMiddleware.authSalonMiddleware, validate(updateSalonSchema), salonController.updateSalon);
router.patch('/theme', authMiddleware.authSalonMiddleware, validate(activateThemeSchema), themeController.activateTheme);
router.post('/subscription/intent', authMiddleware.authSalonMiddleware, validate(subscriptionIntentSchema), salonController.createSubscriptionPaymentIntent);
router.post('/subscription/upgrade', authMiddleware.authSalonMiddleware, validate(upgradeSubscriptionSchema), salonController.upgradeSubscription);

module.exports = router;