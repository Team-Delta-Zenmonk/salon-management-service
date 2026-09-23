const { SUCCESS } = require("../libs/constants");
const { notificationService } = require("../services");

exports.listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications({
      salon: req.salon,
      query: req.query,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error in listNotifications controller:", error);
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead({
      salon: req.salon,
      params: req.params,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error in markAsRead controller:", error);
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead({
      salon: req.salon,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error in markAllAsRead controller:", error);
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification({
      salon: req.salon,
      params: req.params,
    });
    return res.status(SUCCESS).json(result);
  } catch (error) {
    console.error("Error in deleteNotification controller:", error);
    next(error);
  }
};
