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

const formatMinutesTo12Hour = (totalM) => {
  const h = Math.floor(totalM / 60) % 24;
  const m = totalM % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

const assertSalonOpenAndWithinOperatingHours = async ({
  salon,
  bookingDate,
  startMinutes,
  totalDuration,
  holidayRepository,
  transaction,
}) => {
  const { BadRequest } = require("../libs/error");

  const bDate = new Date(bookingDate);
  if (isNaN(bDate.getTime())) {
    throw new BadRequest("Invalid booking date");
  }

  const dateStr = bDate.toISOString().slice(0, 10);
  const dayOfWeek = bDate.getUTCDay();

  if (holidayRepository) {
    const holidays = await holidayRepository.getSalonHolidaysByDate(salon.id, dateStr, 1);
    const isHoliday = holidays.some((h) => {
      const hDateStr = new Date(h.holiday_date).toISOString().slice(0, 10);
      return hDateStr === dateStr;
    });

    if (isHoliday) {
      throw new BadRequest(
        `The salon is closed on ${dateStr} due to a salon holiday.`
      );
    }
  }

  const businessHours =
    salon.business_hours?.[dayOfWeek] ||
    salon.business_hours?.[String(dayOfWeek)];

  if (
    !businessHours ||
    businessHours.is_closed ||
    !businessHours.start_time ||
    !businessHours.end_time
  ) {
    throw new BadRequest(
      "The salon is closed or has no operating hours configured on this day."
    );
  }

  const dayStart = toMinutes(businessHours.start_time);
  const dayEnd = toMinutes(businessHours.end_time);

  if (dayEnd <= dayStart) {
    throw new BadRequest(
      "The salon operating hours for this day are invalid."
    );
  }

  const endMinutes = startMinutes + totalDuration;

  if (startMinutes < dayStart) {
    throw new BadRequest(
      `Appointment start time (${formatMinutesTo12Hour(startMinutes)}) is before salon opening time (${formatMinutesTo12Hour(dayStart)}).`
    );
  }

  if (endMinutes > dayEnd) {
    throw new BadRequest(
      `Appointment ends at ${formatMinutesTo12Hour(endMinutes)}, which is after salon closing time (${formatMinutesTo12Hour(dayEnd)}).`
    );
  }
};

module.exports = {
  toMinutes,
  getMaxDailyOperatingMinutes,
  formatMinutesToHours,
  formatMinutesTo12Hour,
  assertSalonOpenAndWithinOperatingHours,
};
