const { DayOfWeek } = require("../models/salon/salon-types");

const NUMBER_TO_DAY = Object.fromEntries(
  Object.entries(DayOfWeek.ENUM).map(([day, num]) => [num, day])
);

const formatActiveHours = (activeHours) => {
  if (!activeHours || typeof activeHours !== "object") return activeHours;

  const formatted = {};
  for (const [key, value] of Object.entries(activeHours)) {
    const dayName = NUMBER_TO_DAY[key] || key;
    formatted[dayName] = value;
  }
  return formatted;
};

const formatStaffTiming = (staff) => {
  if (!staff) return staff;
  const staffObj = typeof staff.toJSON === "function" ? staff.toJSON() : { ...staff };

  if (staffObj.active_hours) {
    staffObj.active_hours = formatActiveHours(staffObj.active_hours);
  }
  return staffObj;
};

const formatStaffListTiming = (staffList) => {
  if (!Array.isArray(staffList)) return [];
  return staffList.map(formatStaffTiming);
};

module.exports = {
  NUMBER_TO_DAY,
  formatActiveHours,
  formatStaffTiming,
  formatStaffListTiming,
};
