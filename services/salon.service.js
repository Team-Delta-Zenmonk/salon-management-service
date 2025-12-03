const mailService = require("./mail.service");
const { error } = require("../libs");
const { salonRepository } = require("../repository");

exports.onBoardSalon = async (payload) => {
    const { email, name, password } = payload.body;

    if (!email || !name || !password) {
        throw new error.BadRequest('All fields are required');
    }

    const salon = await salonRepository.findOne({ email });

    if (salon) {
        throw new error.BadRequest('Salon already exists');
    }

    const newSalon = await salonRepository.create({ email, name, });
    await mailService.sendMailToUser(email, 'Welcome to Salon', 'Welcome to Salon');

    return newSalon;
}