const { z } = require("zod");
const { BookingStatus } = require("../../models/booking/booking-types");

exports.listCustomerBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).default(10).optional(),
    status: z.enum(BookingStatus.getValues()).optional(),
    salon_id: z.string().optional(),
  }),
});
