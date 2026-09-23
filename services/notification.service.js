const { notificationRepository } = require("../repository");
const { error } = require("../libs");

exports.listNotifications = async (payload) => {
  const { salon, query } = payload;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const where = { salon_id: salon.id };
  if (query.is_read !== undefined) {
    where.is_read = query.is_read === "true" || query.is_read === true;
  }

  const [result, unread_notification_count] = await Promise.all([
    notificationRepository.findAndCountAll({
      criteria: where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    }),
    notificationRepository.count({
      where: { salon_id: salon.id, is_read: false },
    }),
  ]);

  return {
    data: result.rows,
    total: result.count,
    current_page: page,
    per_page: limit,
    unread_notification_count,
  };
};

exports.markAsRead = async (payload) => {
  const { salon, params } = payload;
  const { uuid } = params;

  const updated = await notificationRepository.markAsRead(uuid, salon.id);
  if (!updated) {
    throw new error.BadRequest("Notification not found");
  }

  return { message: "Notification marked as read" };
};

exports.markAllAsRead = async (payload) => {
  const { salon } = payload;
  const updatedCount = await notificationRepository.markAllAsRead(salon.id);
  return { message: "All notifications marked as read", updated_count: updatedCount };
};

exports.deleteNotification = async (payload) => {
  const { salon, params } = payload;
  const { uuid } = params;

  const deletedCount = await notificationRepository.softDelete({
    uuid,
    salon_id: salon.id,
  });

  if (!deletedCount) {
    throw new error.BadRequest("Notification not found");
  }

  return { message: "Notification deleted successfully" };
};
