const { DayOfWeek } = require("../models/salon/salon-types");
const { salonRepository } = require("../repository");

exports.updateSalon = async (payload) => {
    const { uuid } = payload.salon;
    if(payload?.body?.business_hours) {
        const result = {};
        for(const [day, value] of Object.entries(payload.body.business_hours)) {
            result[DayOfWeek.ENUM[day]] = value;
        }
        payload.body.business_hours = result;
    }

    return await salonRepository.update({
        payload: payload.body,
        criteria: { uuid }
    });
}