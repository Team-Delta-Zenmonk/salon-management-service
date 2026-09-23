const router = require("express").Router();
const { notificationController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
const { validate } = require("../middlewares/validate.middleware");
const { listNotificationsSchema } = require("../schema/notification/list-notifications.schema");

router.get(
  "/",
  authMiddleware.authSalonMiddleware,
  validate(listNotificationsSchema),
  notificationController.listNotifications
);

router.patch(
  "/read-all",
  authMiddleware.authSalonMiddleware,
  notificationController.markAllAsRead
);

router.patch(
  "/:uuid/read",
  authMiddleware.authSalonMiddleware,
  notificationController.markAsRead
);

router.delete(
  "/:uuid",
  authMiddleware.authSalonMiddleware,
  notificationController.deleteNotification
);

module.exports = router;
