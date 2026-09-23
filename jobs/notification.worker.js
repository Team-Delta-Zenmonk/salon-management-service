const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const { getQueue } = require("../config/queue");
const { notificationRepository } = require("../repository");
const socketManager = require("../libs/socket.manager");

const QUEUE_NAME = process.env.NOTIFICATION_QUEUE_NAME || "notification";
const JOB_NAME = process.env.NOTIFICATION_JOB_NAME || "dispatch";

function initNotificationWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { salonId, bookingId, type, title, message, data } = job.data;
      console.log(`[NotificationWorker] Processing job ${job.id} of type '${type}' for Salon #${salonId}`);

      const notification = await notificationRepository.create({
        salon_id: salonId,
        booking_id: bookingId || null,
        type,
        title,
        message,
        data: data || {},
      });

      const delivered = socketManager.sendToSalon(salonId, {
        event: "NOTIFICATION_RECEIVED",
        data: notification,
      });

      console.log(
        `[NotificationWorker] Job ${job.id} completed. Notification #${notification.id} created. Live Socket.IO delivered: ${delivered}`
      );

      return notification;
    },
    {
      connection: redisConnection,
      concurrency: Number(process.env.NOTIFICATION_WORKER_CONCURRENCY) || 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[NotificationWorker] Job ${job?.id} failed for Salon #${job?.data?.salonId}:`,
      err.message
    );
  });

  worker.on("error", (err) => {
    console.error("[NotificationWorker] Worker error:", err.message);
  });

  console.log("[NotificationWorker] Notification worker started and listening for jobs.");
}

async function enqueueNotificationJob({ salonId, bookingId, type, title, message, data }) {
  try {
    const queue = getQueue(QUEUE_NAME);
    const job = await queue.add(
      JOB_NAME,
      { salonId, bookingId, type, title, message, data },
      {
        attempts: Number(process.env.JOB_ATTEMPTS) || 3,
        backoff: { type: "exponential", delay: Number(process.env.JOB_BACKOFF_DELAY) || 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    console.log(`[NotificationWorker] Enqueued '${type}' notification job ${job.id} for Salon #${salonId}`);
    return job;
  } catch (err) {
    console.error(`[NotificationWorker] Failed to enqueue notification job for Salon #${salonId}:`, err.message);

    try {
      const notification = await notificationRepository.create({
        salon_id: salonId,
        booking_id: bookingId || null,
        type,
        title,
        message,
        data: data || {},
      });
      socketManager.sendToSalon(salonId, {
        event: "NOTIFICATION_RECEIVED",
        data: notification,
      });
      console.log(`[NotificationWorker] Fallback executed: Notification #${notification.id} created.`);
    } catch (fallbackErr) {
      console.error("[NotificationWorker] Direct fallback also failed:", fallbackErr.message);
    }
  }
}

module.exports = {
  initNotificationWorker,
  enqueueNotificationJob,
  QUEUE_NAME,
  JOB_NAME,
};

