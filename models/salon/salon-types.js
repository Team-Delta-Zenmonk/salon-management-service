const { ENUM } = require("../common/enum");

class SalonType extends ENUM {
    static ENUM = {
        UNISEX: 'unisex',
        MALE: 'male',
        FEMALE: 'female',
    };
}

exports.SalonType = SalonType;

class DayOfWeek extends ENUM {
    static ENUM = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    }
}

exports.DayOfWeek = DayOfWeek;