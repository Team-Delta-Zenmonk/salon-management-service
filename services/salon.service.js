const { error } = require("../libs");
const { DayOfWeek } = require("../models/salon/salon-types");
const {
  salonRepository,
  cartRepository,
  holidayRepository,
  staffRepository,
  staffServiceRepository,
  bookingServiceRepository,
} = require("../repository");
const { Op } = require("sequelize");
const { Category, sequelize } = require("../models");

exports.updateSalon = async (payload) => {
  const { uuid } = payload.salon;

  if (payload?.body?.business_hours) {
    const result = {};
    for (const [day, value] of Object.entries(payload.body.business_hours)) {
      result[DayOfWeek.ENUM[day]] = value;
    }
    payload.body.business_hours = result;
  }

  const result = await salonRepository.update({
    payload: payload.body,
    criteria: { uuid },
  });

  if (result[0] === 0) {
    throw new error.BadRequest("Salon not updated");
  }

  return "Salon updated successfully";
};

exports.getAvailableSlots = async (payload) => {
  const { cart_id, start_date, days } = payload.query;

  let cart = await cartRepository.getCartByUuid(cart_id);
  if (!cart) throw new error.BadRequest("Cart not found");

  cart = cart.toJSON();
  const salon = cart.salon;
  if (!salon) throw new error.BadRequest("Salon not found");

  const cartItems = cart.cart_items.sort((a, b) => a.sequence - b.sequence);

  const totalDuration = cartItems.reduce((acc, i) => acc + i.duration, 0);

  if (totalDuration !== cart.total_duration) {
    throw new error.BadRequest("Cart total duration mismatch");
  }

  const salonHolidays = await holidayRepository.getSalonHolidaysByDate(salon.id, start_date, days);

  const allStaffs = await staffRepository.findAll({
    criteria: { salon_id: salon.id },
  });
  const staffIds = allStaffs.map((s) => s.id);

  const staffHolidays = await holidayRepository.getStaffHolidaysByDate(staffIds, start_date, days);

  const staffByService = await staffServiceRepository.getStaffByService({
    service_ids: cartItems.map((i) => i.service_id),
    salon_id: salon.id,
  });

  const bookingsByStaff = await bookingServiceRepository.getBookingsByStaff({
    salon_id: salon.id,
    start_date,
    days,
  });

  const result = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(start_date);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);
    const dayOfWeek = date.getDay();

    if (salonHolidays.includes(dateStr)) {
      continue;
    }

    const businessHours = salon.business_hours?.[dayOfWeek];

    if (!businessHours?.start_time || !businessHours?.end_time) {
      continue;
    }

    const dayStart = toMinutes(businessHours.start_time);
    const dayEnd = toMinutes(businessHours.end_time);

    const slots = [];

    for (let slotStart = dayStart; slotStart + totalDuration <= dayEnd; slotStart += 15) {
      let offset = 0;
      let validSlot = true;
      const serviceOptions = [];

      for (const cartItem of cartItems) {
        const serviceStart = slotStart + offset;
        const serviceEnd = serviceStart + cartItem.duration;
        offset += cartItem.duration;

        const staffList = staffByService[cartItem.service_id] || [];

        if (cartItem.staff_id) {
          const staff = staffList.find((s) => s.id === cartItem.staff_id);

          if (!staff || !isStaffAvailable(staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff)) {
            validSlot = false;
            break;
          }

          serviceOptions.push({
            service_id: cartItem.service_id,
            staff_options: [staff.id],
          });
        } else {
          let assignedStaff = null;

          for (const staff of staffList) {
            if (isStaffAvailable(staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff)) {
              assignedStaff = staff;
              break;
            }
          }
          if (!assignedStaff) {
            validSlot = false;
            break;
          }

          serviceOptions.push({
            service_id: cartItem.service_id,
            staff_id: assignedStaff.id,
          });
        }
      }

      if (validSlot) {
        slots.push({
          start: toISODateTime(dateStr, slotStart),
          end: toISODateTime(dateStr, slotStart + totalDuration),
          services: serviceOptions,
        });
      }
    }
    if (slots.length) {
      result.push({ date: dateStr, slots });
    }
  }
  return result;
};

const isStaffAvailable = (staff, serviceStart, serviceEnd, dateStr, staffHolidays, bookingsByStaff) => {
  if (staffHolidays.get(staff.id)?.has(dateStr)) {
    return false;
  }

  const day = new Date(dateStr).getDay();

  const active = staff.active_hours[day];
  if (!active) {
    return false;
  }

  const activeStart = toMinutes(active.start_time);
  const activeEnd = toMinutes(active.end_time);

  if (serviceStart < activeStart || serviceEnd > activeEnd) {
    return false;
  }

  const staffBookings = bookingsByStaff[staff.id] || [];

  const serviceStartDate = new Date(dateStr);
  serviceStartDate.setUTCHours(0, 0, 0, 0);
  serviceStartDate.setUTCMinutes(serviceStart);

  const serviceEndDate = new Date(dateStr);
  serviceEndDate.setUTCHours(0, 0, 0, 0);
  serviceEndDate.setUTCMinutes(serviceEnd);

  for (const booking of staffBookings) {
    if (serviceStartDate < booking.end && serviceEndDate > booking.start) {
      return false;
    }
  }

  return true;
};
const toISODateTime = (dateStr, minutes) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMinutes(minutes);
  return d.toISOString();
};

const toMinutes = (dateTime) => {
  if (typeof dateTime === "string" && /^\d{1,2}:\d{2}$/.test(dateTime)) {
    const [h, m] = dateTime.split(":").map(Number);
    return h * 60 + m;
  }
  const d = new Date(dateTime);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

const toTimeString = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

exports.listSalons = async (payload) => {
  let { page, limit, search, category, latitude, longitude } = payload.query;

  const offset = page && limit ? (page - 1) * limit : 0;
  const where = {};
  const include = [];

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  if (category) {
    include.push({
      model: Category,
      as: "categories",
      where: {
        name: { [Op.iLike]: `%${category}%` },
      },
      required: true,
    });
  } else {
    include.push({
      model: Category,
      as: "categories",
      required: false,
    });
  }

  let attributes = undefined;
  let order = [["created_at", "DESC"]];

  if (latitude && longitude) {
    const distanceLiteral = sequelize.literal(
      `(6371 * acos(
                cos(radians(${latitude}))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(${longitude}))
                + sin(radians(${latitude}))
                * sin(radians(latitude))
            ))`,
    );

    attributes = {
      include: [[distanceLiteral, "distance"]],
    };

    order = [[sequelize.literal("distance"), "ASC"]];
  }

  const { count, rows } = await salonRepository.findAndCountAll({
    criteria: where,
    include,
    offset,
    limit,
    attributes,
    order,
  });

  return {
    total: count,
    page,
    limit,
    data: rows,
  };
};

exports.getSalon = async (payload) => {
  const { uuid } = payload.params;
  console.log("uuid: ", uuid);

  const salon = await salonRepository.findByUuid(uuid);

  if (!salon) {
    throw new error.BadRequest("Salon not found");
  }

  return salon;
};
