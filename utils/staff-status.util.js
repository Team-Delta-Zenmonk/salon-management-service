function isStaffInactive(staffOrEndDate) {
  if (!staffOrEndDate) return false;

  const endDate = typeof staffOrEndDate === "string" ? staffOrEndDate : staffOrEndDate.end_date;

  if (!endDate) return false;

  const todayStr = new Date().toISOString().split("T")[0];

  let endDateStr = endDate;
  if (/^\d{2}-\d{2}-\d{4}$/.test(endDate)) {
    const [d, m, y] = endDate.split("-");
    endDateStr = `${y}-${m}-${d}`;
  }

  return endDateStr <= todayStr;
}

function assertStaffActive(staffOrEndDate, errorLib) {
  if (isStaffInactive(staffOrEndDate)) {
    const { BadRequest } = errorLib || require("../libs").error;
    throw new BadRequest("Cannot assign service to inactive staff member");
  }
}

module.exports = {
  assertStaffActive,
};
