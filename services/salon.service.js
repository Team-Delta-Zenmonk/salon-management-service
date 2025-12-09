const { error } = require("../libs");
const { salonRepository } = require("../repository");

exports.updateSalon = async (payload) => {
    const { uuid } = payload.salon;

    return await salonRepository.update({
        payload: payload.body,
        criteria: { uuid }
    });
}