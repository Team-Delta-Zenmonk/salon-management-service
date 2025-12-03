const { error } = require("../libs");
const { salonRepository } = require("../repository");

exports.updateSalon = async (payload) => {
    const { uuid } = payload.salon;

    let salon = await salonRepository.findOne({ uuid });

    if (!salon) {
        throw new error.NotFound("Salon not found");
    }

    const allowedFields = ["name", "address", "phone"];

    for (let key of Object.keys(payload.body)) {
        if (!allowedFields.includes(key)) {
            throw new error.BadRequest(`Field not allowed: ${key}`);
        }
    }

    return await salonRepository.update({
        payload: payload.body,
        criteria: { uuid }
    });
}