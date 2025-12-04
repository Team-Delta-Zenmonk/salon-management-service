const { ENUM } = require("../common/enum");

class SalonType extends ENUM {
    static ENUM = {
        UNISEX: 'unisex',
        MALE: 'male',
        FEMALE: 'female',
    };
}

exports.SalonType = SalonType;