const { default: z } = require("zod");

exports.createAdminBookingSchema = z.object({
    body: z.object({
        admin_booking: z.any(), // Accept any JSON object
        customer_id: z.number().optional(),
        total_price: z.number(),
        total_duration: z.number(),
        booking_type: z.enum(["single", "booking"]),
        booking_execution_mode: z.enum(["sequential", "parallel"]),
        status: z.enum(["pending", "completed", "cancelled"]),
        booking_start_time: z.coerce.date(),
        booking_end_time: z.coerce.date(),
        booking_date: z.coerce.date(),
        services: z.array(z.object({
            service_id: z.number(),
            staff_id: z.number(),
            sequence: z.number(),
            offset_minutes: z.number(),
            duration_minutes: z.number(),
            price: z.number(),
            start_time: z.coerce.date(),
            end_time: z.coerce.date(),
        })),
    })
});

