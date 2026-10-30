const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const getMaxDailyOperatingMinutes = (businessHours) => {
  if (!businessHours) return 0;
  return Math.max(
    0,
    ...Object.values(businessHours).map((h) => {
      if (!h?.start_time || !h?.end_time) return 0;
      const start = toMinutes(h.start_time);
      const end = toMinutes(h.end_time);
      return end > start ? end - start : 0;
    })
  );
};

const formatMinutesToHours = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hours`;
  return `${h}h ${m}m`;
};

module.exports = {
  toMinutes,
  getMaxDailyOperatingMinutes,
  formatMinutesToHours,
};
