const { error } = require("../libs");

exports.helloSalon1 = () => {
    return 'Hello Salon';
}

exports.helloSalon2 = () => {
    throw new error.BadRequest('Bad Request     hhhhhhhhhh');
}

