const { default: z } = require("zod");
const { PaymentPolicy } = require("../../models/salon/salon-types");
const { FIELD_LIMITS } = require("../../common/field-limits");

exports.createAdminBookingSchema = z.object({
  body: z.object({
    admin_booking: z.object({
      name: z.string().max(FIELD_LIMITS.NAME, `Name cannot exceed ${FIELD_LIMITS.NAME} characters`),
      phone: z.string().max(FIELD_LIMITS.PHONE, `Phone cannot exceed ${FIELD_LIMITS.PHONE} digits`),
    }),
    customer_id: z.number().optional().nullable(),
    booking_start_time: z.coerce.date().refine((val) => val.getTime() >= Date.now() - 60 * 1000, {
      message: "Booking start time cannot be in the past",
    }),
    booking_date: z.coerce.date().refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return val.getTime() >= today.getTime();
    }, {
      message: "Booking date cannot be in the past",
    }),
    booking_date: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== "", {
        message: "Booking date is required",
      })
      .transform((val) => new Date(val))
      .refine((val) => !isNaN(val.getTime()), {
        message: "Invalid booking date format",
      })
      .refine((val) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return val.getTime() >= today.getTime();
      }, {
        message: "Booking date cannot be in the past",
      }),
    services: z.array(
      z.object({
        service_id: z.number(),
        staff_id: z.number().optional().nullable(),
        sequence: z.number().optional(),
      }),
    ),
    payment_policy: z.enum(Object.values(PaymentPolicy.ENUM)).optional(),
    payment_preference: z.enum(Object.values(PaymentPolicy.ENUM)).optional(),
    is_walk_in: z.boolean().optional(),
  }),
});
