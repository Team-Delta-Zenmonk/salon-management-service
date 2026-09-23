const { Notification } = require("../models");
const BaseRepository = require("./base.repository");

class NotificationRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }

  async markAsRead(uuid, salonId) {
    const [updatedRows] = await this.model.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          uuid,
          salon_id: salonId,
        },
      },
    );
    return updatedRows > 0;
  }

  async markAllAsRead(salonId) {
    const [updatedRows] = await this.model.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          salon_id: salonId,
          is_read: false,
        },
      },
    );
    return updatedRows;
  }
}

module.exports = new NotificationRepository({ model: Notification });
