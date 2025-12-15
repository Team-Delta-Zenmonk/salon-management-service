const { ENUM } = require("../common/enum");

class BookingType extends ENUM {
    static ENUM = {
        SINGLE: 'single',
        BOOKING: 'booking',
    };
}

exports.BookingType = BookingType;


class BookingExecutionMode extends ENUM {
    static ENUM = {
        SEQUENTIAL: 'sequential',
        PARALLEL: 'parallel',
    };
}

exports.BookingExecutionMode = BookingExecutionMode;


class BookingStatus extends ENUM {
    static ENUM = {
        PENDING: 'pending',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
    };
}

exports.BookingStatus = BookingStatus;