const { Queue } = require("bullmq");
const { redisConnection } = require("./redis");

const queues = new Map();

const getQueue = (name) => {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: redisConnection }));
  }
  return queues.get(name);
};

module.exports = { getQueue };
