const { holidayController } = require("../controllers");
const { validate } = require("../middlewares/validate.middleware");
const { createHolidaySchema } = require("../schema/holiday/create-holiday.schema");
const { updateHolidaySchema } = require("../schema/holiday/update-holiday.schema");
const { deleteHolidaySchema } = require("../schema/holiday/delete-holiday.schema");
const { listHolidaySchema } = require("../schema/holiday/list-holiday.schema");

const router = require("express").Router();

router.post("/", validate(createHolidaySchema), holidayController.createHoliday);
router.put("/:uuid", validate(updateHolidaySchema), holidayController.updateHoliday);
router.delete("/:uuid", validate(deleteHolidaySchema), holidayController.deleteHoliday);
router.get("/", validate(listHolidaySchema), holidayController.listHolidays);

module.exports = router;
