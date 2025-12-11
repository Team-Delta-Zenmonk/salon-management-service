const { error } = require("../libs");
const { HolidayType } = require("../models/holiday/holiday-types");
const { holidayRepository, staffRepository } = require("../repository");

exports.createHoliday = async (payload) => {
    const { body, salon } = payload;

    const { holiday_type, parent_id } = body;

    if (holiday_type === HolidayType.ENUM.SALON) {
        return holidayRepository.create({ ...body, parent_id: salon.id });
    }

    const staff = await staffRepository.findOne({ uuid: parent_id, salon_id: salon.id });

    if (!staff) {
        throw new error.NotFound("Staff not found");
    }

    return holidayRepository.create({ ...body, parent_id: staff.id });

}

exports.updateHoliday = async (payload) => {
    const { params, body } = payload;

    const holiday = await holidayRepository.findOne({ uuid: params.uuid });
    // console.log(holiday);
    if (!holiday) {
        throw new error.NotFound("Holiday not found");
    }

    const response = await holidayRepository.update({ payload: body, criteria: { uuid: params.uuid } });

    if (response[0] == 1) {
        return { message: "Holiday updated successfully" };
    }

    throw new error.BadRequest("Holiday not updated");
}

exports.deleteHoliday = async (payload) => {
    const { params } = payload;

    const holiday = await holidayRepository.findOne({ uuid: params.uuid });

    if (!holiday) {
        throw new error.NotFound("Holiday not found");
    }

    await holidayRepository.softDelete({ uuid: params.uuid });

    return { message: "Holiday deleted successfully" };
}

exports.listHolidays = async (payload) => {
    const { query, salon } = payload

    const limit = query?.limit || 10;
    const page = query?.page || 1;
    const holiday_type = query.holiday_type;
    const parent_id = query.parent_id;

    const year = query.year ? Number(query.year) : null;
    const month = query.month ? Number(query.month) : null;

    let criteria = {};

    // Filter by holiday_type + parent_id 
    if (holiday_type === HolidayType.ENUM.SALON) {
        criteria.holiday_type = holiday_type;
        criteria.parent_id = salon.id;
    } else {
        const staff = await staffRepository.findOne({ uuid: parent_id, salon_id: salon.id });

        if (!staff) {
            throw new error.NotFound("Staff not found");
        }

        criteria.holiday_type = holiday_type;
        criteria.parent_id = staff.id;
    }

    // Add date filter
    criteria = holidayRepository.addHolidayDateFilter(criteria, year, month);

    return await holidayRepository.listHolidays({ criteria, limit, page });
}