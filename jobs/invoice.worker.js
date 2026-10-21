const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const { getQueue } = require("../config/queue");
const invoiceService = require("../services/invoice.service");

const QUEUE_NAME = process.env.INVOICE_QUEUE_NAME || "invoice";
const JOB_NAME = process.env.INVOICE_JOB_NAME || "generate";

function initInvoiceWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { invoiceId } = job.data;
      console.log(`[InvoiceWorker] Processing job ${job.id} for Invoice #${invoiceId}`);

      await invoiceService.generateInvoice({ invoiceId });

      console.log(`[InvoiceWorker] Completed job ${job.id} for Invoice #${invoiceId}`);
    },
    {
      connection: redisConnection,
      concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[InvoiceWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[InvoiceWorker] Worker error:", err.message);
  });

  console.log("[InvoiceWorker] Worker started and listening for jobs.");
}

async function enqueueInvoiceJob(data) {
  const invoiceId = typeof data === "object" && data !== null ? data.invoiceId : data;
  try {
    const queue = getQueue(QUEUE_NAME);
    const job = await queue.add(JOB_NAME, { invoiceId }, {
      attempts: Number(process.env.JOB_ATTEMPTS) || 3,
      backoff: { type: "exponential", delay: Number(process.env.JOB_BACKOFF_DELAY) || 3000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log(`[InvoiceWorker] Enqueued job ${job.id} for Invoice #${invoiceId}`);
    return job;
  } catch (err) {
    console.error(`[InvoiceWorker] Failed to enqueue invoice job for Invoice #${invoiceId}:`, err.message);
    invoiceService.generateInvoice({ invoiceId }).catch((fallbackErr) => {
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
