const { error } = require("../libs");
const { sequelize } = require("../config/db/db-connection");

function getActiveStaffLiteral(columnPrefix = "") {
  const prefix = columnPrefix ? `${columnPrefix}.` : "";
  const todayStr = new Date().toISOString().split("T")[0];

  return sequelize.literal(`(
    ${prefix}end_date IS NULL 
    OR ${prefix}end_date = '' 
    OR (
      CASE 
        WHEN ${prefix}end_date ~ '^\\d{2}-\\d{2}-\\d{4}$' 
        THEN TO_DATE(${prefix}end_date, 'DD-MM-YYYY') > '${todayStr}'::date
        ELSE ${prefix}end_date::date > '${todayStr}'::date
      END
    )
  )`);
}

function isStaffInactive(staffOrEndDate, targetDate = null) {
  if (!staffOrEndDate) return false;

  const endDate = typeof staffOrEndDate === "string" ? staffOrEndDate : staffOrEndDate.end_date;

  if (!endDate) return false;

  let compareDateStr = new Date().toISOString().split("T")[0];
  if (targetDate) {
    if (targetDate instanceof Date && !isNaN(targetDate.getTime())) {
      compareDateStr = targetDate.toISOString().split("T")[0];
    } else if (typeof targetDate === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
        compareDateStr = targetDate.trim();
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(targetDate.trim())) {
        const [d, m, y] = targetDate.trim().split("-");
        compareDateStr = `${y}-${m}-${d}`;
      } else {
        const parsed = new Date(targetDate);
        if (!isNaN(parsed.getTime())) {
          compareDateStr = parsed.toISOString().split("T")[0];
        }
      }
    }
  }

  let endDateStr = endDate;
  if (/^\d{2}-\d{2}-\d{4}$/.test(endDate)) {
    const [d, m, y] = endDate.split("-");
    endDateStr = `${y}-${m}-${d}`;
  }

  return endDateStr <= compareDateStr;
}

function assertStaffActive(staffOrEndDate, errorLib, targetDate = null) {
  if (isStaffInactive(staffOrEndDate, targetDate)) {
    const { BadRequest } = errorLib || error;
    throw new BadRequest("Cannot assign service to inactive staff member");
  }
}

module.exports = {
  getActiveStaffLiteral,
  isStaffInactive,
  assertStaffActive,
};
