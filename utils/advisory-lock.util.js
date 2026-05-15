const crypto = require("crypto");

const buildAdvisoryLockKey = ({ staffId, startTime, endTime }) => {
  const rawKey = `${staffId}:${new Date(startTime).toISOString()}:${new Date(endTime).toISOString()}`;
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex").slice(0, 15);

  return BigInt(`0x${hash}`).toString();
};

const acquireTransactionAdvisoryLock = async ({ transaction, staffId, startTime, endTime }) => {
  const lockKey = buildAdvisoryLockKey({
    staffId,
    startTime,
    endTime,
  });

  await transaction.sequelize.query(`SELECT pg_advisory_xact_lock(${lockKey})`, { transaction });
};

module.exports = {
  acquireTransactionAdvisoryLock,
};
