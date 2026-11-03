const calculateEndOfDayExpiry = (baseDate, durationDays = 0) => {
  const target = new Date(
    baseDate instanceof Date ? baseDate.getTime() : (baseDate || Date.now()),
  );
  const numDays = Math.max(0, Number(durationDays) || 0);

  target.setUTCDate(target.getUTCDate() + numDays);

  target.setUTCHours(23, 59, 59, 999);

  return target;
};

module.exports = {
  calculateEndOfDayExpiry,
};
