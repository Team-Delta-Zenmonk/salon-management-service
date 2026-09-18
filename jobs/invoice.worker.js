const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const { getQueue } = require("../config/queue");
const invoiceService = require("../services/invoice.service");

const QUEUE_NAME = "invoice";
const JOB_NAME = "generate";

function initInvoiceWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { bookingId } = job.data;
      console.log(`[InvoiceWorker] Processing job ${job.id} for Booking #${bookingId}`);

      await invoiceService.generateAndSendInvoiceForBooking({ bookingId });

      console.log(`[InvoiceWorker] Completed job ${job.id} for Booking #${bookingId}`);
    },
    {
      connection: redisConnection,
      concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[InvoiceWorker] Job ${job?.id} failed for Booking #${job?.data?.bookingId}:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[InvoiceWorker] Worker error:", err.message);
  });

  console.log("[InvoiceWorker] Worker started and listening for jobs.");
}

async function enqueueInvoiceJob(bookingId) {
  try {
    const queue = getQueue(QUEUE_NAME);
    const job = await queue.add(JOB_NAME, { bookingId }, {
      attempts: Number(process.env.JOB_ATTEMPTS) || 3,
      backoff: { type: "exponential", delay: Number(process.env.JOB_BACKOFF_DELAY) || 3000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log(`[InvoiceWorker] Enqueued job ${job.id} for Booking #${bookingId}`);
    return job;
  } catch (err) {
    console.error(`[InvoiceWorker] Failed to enqueue job for Booking #${bookingId}:`, err.message);
    invoiceService.generateAndSendInvoiceForBooking({ bookingId }).catch((fallbackErr) => {
      console.error("[InvoiceWorker] Direct fallback also failed:", fallbackErr.message);
    });
  }
}

module.exports = {
  initInvoiceWorker,
  enqueueInvoiceJob,
  QUEUE_NAME,
  JOB_NAME,
};
