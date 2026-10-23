const { z } = require("zod");
const { BookingStatus } = require("../../models/booking/booking-types");

exports.listCustomerBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
    status: z.enum(BookingStatus.getValues()).optional(),
  }),
});
