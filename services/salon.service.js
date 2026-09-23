const crypto = require("crypto");
const { error } = require("../libs");
const stripe = require("../config/stripe");
const {
  DayOfWeek,
  SubscriptionPlan,
  SubscriptionStatus,
} = require("../models/salon/salon-types");
const {
  SubscriptionInvoiceStatus,
  SubscriptionPaymentMethod,
} = require("../models/subscription-invoice/subscription-invoice-types");
const { isReservedSlug } = require("../libs/reserved-slugs");
const mailService = require("./mail.service");
const { buildSalonLiveEmailHtml } = require("../templates");
const { enqueueNotificationJob } = require("../jobs/notification.worker");
const {
  salonRepository,
  cartRepository,
  holidayRepository,
  staffRepository,
  staffServiceRepository,
  bookingServiceRepository,
  subscriptionInvoiceRepository,
  subscriptionPlanRepository,
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

  if (payload?.body?.slug) {
    const normalizedSlug = String(payload.body.slug).toLowerCase().trim();

    if (isReservedSlug(normalizedSlug)) {
      throw new error.BadRequest(
        "This subdomain handle is reserved by the platform",
      );
    }

    const existingSalonWithSlug = await salonRepository.findOne(
      { slug: normalizedSlug },
      [],
      {},
      {},
    );

    if (existingSalonWithSlug && existingSalonWithSlug.uuid !== uuid) {
      throw new error.BadRequest(
        "This storefront handle is already claimed by another salon",
      );
    }

    payload.body.slug = normalizedSlug;
  }

  let isNewlyOnboarded = false;
  let currentSalon = null;

  if (payload?.body?.is_onboarded === true) {
    currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
    if (currentSalon && !currentSalon.is_onboarded) {
      isNewlyOnboarded = true;
      if (
        !currentSalon.trial_ends_at &&
        currentSalon.subscription_status !== "active"
      ) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        payload.body.trial_ends_at = trialEndDate;
        payload.body.subscription_status = "trial";
        if (!payload.body.subscription_plan) {
          payload.body.subscription_plan =
            currentSalon.subscription_plan || "trial";
        }
      }

      const salonSlug = payload.body.slug || currentSalon.slug;
      const salonEmail = currentSalon.email;
      if (salonEmail && salonSlug) {
        const baseDomain = process.env.STOREFRONT_BASE_DOMAIN || "salon.com";
        const storefrontUrl = `https://${salonSlug}.${baseDomain}`;
        setImmediate(async () => {
          try {
            const liveHtml = buildSalonLiveEmailHtml({
              ownerName: currentSalon.name || "Salon Partner",
              salonName: currentSalon.name || "Your Salon",
              salonUrl: storefrontUrl,
              dashboardUrl: `${process.env.FRONTEND_URL || "https://salon.com"}/owner/dashboard`,
              platformName: "ZenMonk Salon",
            });

            await mailService.sendMailToUser(
              salonEmail,
              "Welcome to ZenMonk — Your Salon is Live!",
              `Congratulations!\n\nYour salon storefront is now live and ready to accept bookings at:\n${storefrontUrl}\n\nYour 14-day free trial has been activated.\nShare your link with your clients or on your social media profiles!\n\nBest,\nThe ZenMonk Team`,
              liveHtml
            );
          } catch (mailErr) {
            console.error(
              "Failed to send salon onboarding welcome email:",
              mailErr,
            );
          }
        });
      }
    }
  }

  const result = await salonRepository.update({
    payload: payload.body,
    criteria: { uuid },
  });

  if (result[0] === 0) {
    throw new error.BadRequest("Salon not updated");
  }

  if (isNewlyOnboarded) {
    enqueueNotificationJob({
      salonId: currentSalon.id,
      type: "SALON_ONBOARDED",
      title: "Storefront is Live!",
      message: "Congratulations! Your salon onboarding is complete,to access the storefront please check you mail inbox.",
      data: {
        salon_uuid: currentSalon.uuid,
        slug: payload.body.slug || currentSalon.slug,
      },
    }).catch((err) => console.error("[UpdateSalon] Notification error:", err.message));
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

  const salonHolidays = await holidayRepository.getSalonHolidaysByDate(
    salon.id,
    start_date,
    days,
  );

  const allStaffs = await staffRepository.findAll({
    criteria: { salon_id: salon.id },
  });
  const staffIds = allStaffs.map((s) => s.id);

  const staffHolidays = await holidayRepository.getStaffHolidaysByDate(
    staffIds,
    start_date,
    days,
  );

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

    for (
      let slotStart = dayStart;
      slotStart + totalDuration <= dayEnd;
      slotStart += 15
    ) {
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

          if (
            !staff ||
            !isStaffAvailable(
              staff,
              serviceStart,
              serviceEnd,
              dateStr,
              staffHolidays,
              bookingsByStaff,
            )
          ) {
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
            if (
              isStaffAvailable(
                staff,
                serviceStart,
                serviceEnd,
                dateStr,
                staffHolidays,
                bookingsByStaff,
              )
            ) {
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

const isStaffAvailable = (
  staff,
  serviceStart,
  serviceEnd,
  dateStr,
  staffHolidays,
  bookingsByStaff,
) => {
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
  const where = {
    stripe_account_id: { [Op.not]: null },
  };
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

    const distanceCondition = sequelize.where(distanceLiteral, {
      [Op.lte]: 50,
    });
    if (where[Op.and]) {
      where[Op.and].push(distanceCondition);
    } else {
      where[Op.and] = [distanceCondition];
    }
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

  const salon = await salonRepository.findByUuid(uuid);

  if (!salon) {
    throw new error.BadRequest("Salon not found");
  }

  return salon;
};

exports.checkSlugAvailability = async (payload) => {
  const { slug } = payload.params;
  const currentSalonUuid = payload.salon?.uuid;

  if (!slug) {
    throw new error.BadRequest("Slug parameter is required");
  }

  const normalizedSlug = String(slug).toLowerCase().trim();

  if (isReservedSlug(normalizedSlug)) {
    return {
      available: false,
      slug: normalizedSlug,
      reason: "This subdomain handle is reserved by the platform",
    };
  }

  const existingSalon = await salonRepository.findOne(
    { slug: normalizedSlug },
    [],
    {},
    {},
  );

  if (existingSalon) {
    if (currentSalonUuid && existingSalon.uuid === currentSalonUuid) {
      return {
        available: true,
        slug: normalizedSlug,
        message: "This is your current salon handle",
      };
    }
    return {
      available: false,
      slug: normalizedSlug,
      reason: "This storefront handle is already claimed by another salon",
    };
  }

  return {
    available: true,
    slug: normalizedSlug,
  };
};

exports.createSubscriptionPaymentIntent = async (payload) => {
  const { uuid } = payload.salon;
  const { plan } = payload.body;

  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  const now = new Date();
  const isActiveYearly =
    currentSalon.subscription_plan === "yearly" &&
    currentSalon.subscription_status === "active" &&
    currentSalon.subscription_expires_at &&
    new Date(currentSalon.subscription_expires_at) > now;

  if (isActiveYearly && plan === "monthly") {
    const expiryDate = new Date(
      currentSalon.subscription_expires_at,
    ).toLocaleDateString("en-IN", {
      dateStyle: "long",
    });
    throw new error.BadRequest(
      `Your yearly plan is active until ${expiryDate}. You can switch to monthly after it expires.`,
    );
  }

  const dbPlan = await subscriptionPlanRepository.findOne({ code: plan });
  if (!dbPlan){
    throw new error.BadRequest(
      `Invalid plan selected`,
    );
  }
  const amountInPaise = Math.round(Number(dbPlan.amount) * 100);
  const amountInRupees = Number(dbPlan.amount);

  // 1. Reuse active PENDING invoice for this salon & plan if created within 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existingPendingInvoice = await subscriptionInvoiceRepository.findOne(
    {
      salon_id: currentSalon.id,
      status: SubscriptionInvoiceStatus.ENUM.PENDING,
      plan,
    },
    [],
    {},
    {
      order: [["created_at", "DESC"]],
    },
  );

  if (existingPendingInvoice && existingPendingInvoice.stripe_payment_intent_id) {
    if (new Date(existingPendingInvoice.created_at) > twentyFourHoursAgo) {
      try {
        const intent = await stripe.paymentIntents.retrieve(
          existingPendingInvoice.stripe_payment_intent_id,
        );

        if (
          ["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(
            intent.status,
          )
        ) {
          return {
            clientSecret: existingPendingInvoice.stripe_client_secret || intent.client_secret,
            paymentIntentId: intent.id,
            amount: amountInRupees,
            plan,
          };
        } else if (intent.status === "succeeded") {
          await exports.activateSubscriptionFromWebhook(intent);
          return {
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id,
            amount: amountInRupees,
            plan,
          };
        } else {
          await subscriptionInvoiceRepository.update({
            payload: { status: SubscriptionInvoiceStatus.ENUM.FAILED },
            criteria: { id: existingPendingInvoice.id },
          });
        }
      } catch (err) {
        console.warn(
          `[Subscription Intent] Could not retrieve intent ${existingPendingInvoice.stripe_payment_intent_id}: ${err.message}`,
        );
      }
    } else {
      await subscriptionInvoiceRepository.update({
        payload: { status: SubscriptionInvoiceStatus.ENUM.FAILED },
        criteria: { id: existingPendingInvoice.id },
      });
    }
  }

  // 2. Mark any other pending invoices for different plans as FAILED
  const otherPendingInvoices = await subscriptionInvoiceRepository.findAll({
    criteria: {
      salon_id: currentSalon.id,
      status: SubscriptionInvoiceStatus.ENUM.PENDING,
    },
  });
  if (otherPendingInvoices && otherPendingInvoices.length > 0) {
    for (const inv of otherPendingInvoices) {
      await subscriptionInvoiceRepository.update({
        payload: { status: SubscriptionInvoiceStatus.ENUM.FAILED },
        criteria: { id: inv.id },
      });
    }
  }

  // 3. Create fresh Stripe PaymentIntent with unique UUID
  const idempotencyKey = `sub_pi_${currentSalon.id}_${plan}_${crypto.randomUUID()}`;

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: amountInPaise,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "subscription",
        salon_uuid: uuid,
        salon_id: currentSalon.id.toString(),
        plan,
      },
    },
    {
      idempotencyKey,
    },
  );

  // 4. Save PENDING record in DB
  const durationDays = plan === "yearly" ? 365 : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  const pendingInvoiceNumber = `INV-PENDING-${Date.now().toString().slice(-6)}-${currentSalon.id}`;

  await subscriptionInvoiceRepository.create({
    salon_id: currentSalon.id,
    invoice_number: pendingInvoiceNumber,
    plan,
    billing_cycle: plan,
    amount: amountInRupees,
    currency: "INR",
    status: SubscriptionInvoiceStatus.ENUM.PENDING,
    payment_method: SubscriptionPaymentMethod.ENUM.CARD,
    transaction_id: paymentIntent.id,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_client_secret: paymentIntent.client_secret,
    billing_period_start: now,
    billing_period_end: expiresAt,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: amountInRupees,
    plan,
  };
};

exports.activateSubscriptionFromWebhook = async (paymentIntent) => {
  const { salon_uuid, plan } = paymentIntent.metadata || {};

  if (!salon_uuid || !plan) {
    return;
  }

  return await subscriptionInvoiceRepository.handleManagedTransaction(
    async (transaction) => {
      const existing = await subscriptionInvoiceRepository.findOne(
        { stripe_payment_intent_id: paymentIntent.id },
        [],
        {},
        { transaction },
      );
      if (existing && existing.status === SubscriptionInvoiceStatus.ENUM.PAID) {
        console.log(
          `[Subscription Webhook] PaymentIntent ${paymentIntent.id} already processed. Skipping.`,
        );
        return;
      }

      const currentSalon = await salonRepository.findOne(
        { uuid: salon_uuid },
        [],
        {},
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!currentSalon) {
        console.error(
          `[Subscription Webhook] Salon not found for uuid: ${salon_uuid}`,
        );
        return;
      }

      const durationDays = plan === "yearly" ? 365 : 30;
      const now = new Date();

      const hasActiveUnexpiredPlan =
        currentSalon.subscription_status === SubscriptionStatus.ENUM.ACTIVE &&
        currentSalon.subscription_expires_at &&
        new Date(currentSalon.subscription_expires_at) > now;

      const baseDate = hasActiveUnexpiredPlan
        ? new Date(currentSalon.subscription_expires_at)
        : now;
      const expiresAt = new Date(baseDate.getTime());
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await salonRepository.update({
        payload: {
          subscription_plan: plan,
          subscription_status: SubscriptionStatus.ENUM.ACTIVE,
          subscription_expires_at: expiresAt,
        },
        criteria: { id: currentSalon.id },
        options: { transaction },
      });

      const amount = paymentIntent.amount / 100;
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${currentSalon.id}`;
      const pmDetails = paymentIntent.payment_method_details || {};
      const paymentMethod =
        pmDetails.type || SubscriptionPaymentMethod.ENUM.CARD;
      const paymentDetails =
        paymentMethod === "card" && pmDetails.card
          ? {
              card_last4: pmDetails.card.last4,
              card_brand: pmDetails.card.brand,
            }
          : paymentMethod === "upi" && pmDetails.upi
            ? { upi_id: pmDetails.upi.vpa }
            : {};

      if (existing && existing.status === SubscriptionInvoiceStatus.ENUM.PENDING) {
        await subscriptionInvoiceRepository.update({
          payload: {
            invoice_number: invoiceNumber,
            status: SubscriptionInvoiceStatus.ENUM.PAID,
            payment_method: paymentMethod,
            payment_details: paymentDetails,
            billing_period_start: baseDate,
            billing_period_end: expiresAt,
          },
          criteria: { id: existing.id },
          options: { transaction },
        });
      } else if (!existing) {
        try {
          await subscriptionInvoiceRepository.create(
            {
              salon_id: currentSalon.id,
              invoice_number: invoiceNumber,
              plan,
              billing_cycle: plan,
              amount,
              currency: "INR",
              status: SubscriptionInvoiceStatus.ENUM.PAID,
              payment_method: paymentMethod,
              payment_details: paymentDetails,
              transaction_id: paymentIntent.id,
              stripe_payment_intent_id: paymentIntent.id,
              stripe_client_secret: paymentIntent.client_secret,
              billing_period_start: baseDate,
              billing_period_end: expiresAt,
            },
            { transaction },
          );
        } catch (err) {
          if (err.name === "SequelizeUniqueConstraintError") {
            console.warn(
              `[Subscription Webhook] Unique constraint hit for intent ${paymentIntent.id} (already saved).`,
            );
            return;
          }
          throw err;
        }
      }

      console.log(
        `[Subscription Webhook] Activated ${plan} plan for salon ${salon_uuid} until ${expiresAt.toISOString()}`,
      );
    },
  );
};

exports.handleSubscriptionPaymentFailed = async (paymentIntent) => {
  const { salon_uuid, plan } = paymentIntent.metadata || {};
  if (!salon_uuid || !plan) return;

  const currentSalon = await salonRepository.findOne(
    { uuid: salon_uuid },
    [],
    {},
    {},
  );
  if (!currentSalon) return;

  const existing = await subscriptionInvoiceRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
  });

  const failureReason =
    paymentIntent.last_payment_error?.message ||
    "Payment authorization declined";
  const pmDetails = paymentIntent.payment_method_details || {};
  const failureDetails = {
    failure_reason: failureReason,
    code: paymentIntent.last_payment_error?.code,
    decline_code: paymentIntent.last_payment_error?.decline_code,
  };

  if (existing) {
    await subscriptionInvoiceRepository.update({
      payload: {
        status: SubscriptionInvoiceStatus.ENUM.FAILED,
        payment_details: failureDetails,
      },
      criteria: { id: existing.id },
    });
    console.log(
      `[Subscription Webhook] Updated invoice status to FAILED for intent ${paymentIntent.id}: ${failureReason}`,
    );
    return;
  }

  const amount = paymentIntent.amount / 100;
  const invoiceNumber = `INV-FAIL-${Date.now().toString().slice(-6)}-${currentSalon.id}`;

  try {
    await subscriptionInvoiceRepository.create({
      salon_id: currentSalon.id,
      invoice_number: invoiceNumber,
      plan,
      billing_cycle: plan,
      amount,
      currency: "INR",
      status: SubscriptionInvoiceStatus.ENUM.FAILED,
      payment_method: pmDetails.type || SubscriptionPaymentMethod.ENUM.CARD,
      payment_details: failureDetails,
      transaction_id: paymentIntent.id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_client_secret: paymentIntent.client_secret,
      billing_period_start: new Date(),
      billing_period_end: new Date(),
    });
    console.log(
      `[Subscription Webhook] Recorded failed invoice for salon ${salon_uuid}: ${failureReason}`,
    );
  } catch (err) {
    console.warn(
      `[Subscription Webhook] Failed invoice creation error: ${err.message}`,
    );
  }
};

exports.upgradeSubscription = async (payload) => {
  const { uuid } = payload.salon;
  const {
    plan,
    billing_cycle,
    payment_method = SubscriptionPaymentMethod.ENUM.CARD,
    payment_details,
    transaction_id,
  } = payload.body;

  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  const durationDays = plan === SubscriptionPlan.ENUM.YEARLY ? 365 : 30;
  const now = new Date();

  const hasActiveUnexpiredPlan =
    currentSalon.subscription_status === SubscriptionStatus.ENUM.ACTIVE &&
    currentSalon.subscription_expires_at &&
    new Date(currentSalon.subscription_expires_at) > now;

  const baseDate = hasActiveUnexpiredPlan
    ? new Date(currentSalon.subscription_expires_at)
    : now;

  const expiresAt = new Date(baseDate.getTime());
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  await salonRepository.update({
    payload: {
      subscription_plan: plan,
      subscription_status: SubscriptionStatus.ENUM.ACTIVE,
      subscription_expires_at: expiresAt,
    },
    criteria: { uuid },
  });

  const dbPlan = await subscriptionPlanRepository.findOne({ code: plan });
  const amount = dbPlan ? Number(dbPlan.amount) : (plan === SubscriptionPlan.ENUM.YEARLY ? 24990 : 2499);
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${currentSalon.id}`;
  const effectiveTxId =
    transaction_id ||
    `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const existingPending = transaction_id
    ? await subscriptionInvoiceRepository.findOne({
        stripe_payment_intent_id: transaction_id,
      })
    : null;

  let invoice;
  if (existingPending) {
    await subscriptionInvoiceRepository.update({
      payload: {
        invoice_number: invoiceNumber,
        status: SubscriptionInvoiceStatus.ENUM.PAID,
        billing_period_start: baseDate,
        billing_period_end: expiresAt,
        payment_method,
        payment_details: payment_details || existingPending.payment_details,
      },
      criteria: { id: existingPending.id },
    });
    invoice = await subscriptionInvoiceRepository.findOne({ id: existingPending.id });
  } else {
    invoice = await subscriptionInvoiceRepository.create({
      salon_id: currentSalon.id,
      invoice_number: invoiceNumber,
      plan,
      billing_cycle: billing_cycle || plan,
      amount,
      currency: "INR",
      status: SubscriptionInvoiceStatus.ENUM.PAID,
      payment_method,
      payment_details: payment_details || null,
      transaction_id: effectiveTxId,
      stripe_payment_intent_id: transaction_id || null,
      billing_period_start: baseDate,
      billing_period_end: expiresAt,
    });
  }

  return {
    message: `Subscription successfully activated on ${plan} plan`,
    salon: updatedSalon,
    invoice,
  };
};

exports.getSubscriptionInvoices = async (payload) => {
  const { uuid } = payload.salon;
  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  const invoices = await subscriptionInvoiceRepository.findAll({
    criteria: { salon_id: currentSalon.id },
    order: [["created_at", "DESC"]],
  });

  return { invoices: invoices || [] };
};
