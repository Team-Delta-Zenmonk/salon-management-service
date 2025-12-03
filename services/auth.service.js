const { error } = require("../libs");
const { salonRepository } = require("../repository");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.loginSalon = async (payload) => {
    const { email, password } = payload.body;

    if (!email || !password) {
        throw new error.BadRequest('Email and password required');
    }

    const salon = await salonRepository.model.scope('withPassword').findOne({ email });

    if (!salon) {
        throw new error.BadRequest('Salon not found');
    }

    const isPasswordValid = bcrypt.compareSync(password, salon.password);

    if (!isPasswordValid) {
        throw new error.BadRequest('Invalid password');
    }

    const token = jwt.sign({ email: salon.email, uuid: salon.uuid }, process.env.JWT_SECRET);
    return { token, salon };
}