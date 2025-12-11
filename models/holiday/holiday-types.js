const { ENUM } = require("../common/enum");

class HolidayType extends ENUM {
    static ENUM = {
        SALON: 'salon',
        STAFF: 'staff',
    }
}

exports.HolidayType = HolidayType;