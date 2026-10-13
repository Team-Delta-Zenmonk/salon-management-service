const crypto = require("crypto");
const stripe = require("../config/stripe");
const error = require("../libs/error");
const {
  salonRepository,
  storefrontThemeRepository,
  themeInvoiceRepository,
} = require("../repository");
const {
  ThemeInvoiceStatus,
  ThemePaymentMethod,
} = require("../models/theme-invoice/theme-invoice-types");

exports.getThemesForSalon = async (payload) => {
  const { uuid } = payload.salon;
  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  const themes = await storefrontThemeRepository.findAll({
    criteria: { is_active: true },
    order: [["id", "ASC"]],
  });

  const paidInvoices = await themeInvoiceRepository.findAll({
    criteria: {
      salon_id: currentSalon.id,
      status: ThemeInvoiceStatus.ENUM.PAID,
    },
  });

  const paidThemeIds = new Set((paidInvoices || []).map((inv) => inv.theme_id));
  const activeSalonThemeId = currentSalon.storefront_theme_id || 1;

  return (themes || []).map((theme) => {
    const data = theme.toJSON ? theme.toJSON() : theme;
    return {
      ...data,
      is_purchased: Boolean(data.is_free) || paidThemeIds.has(data.id),
      is_current: data.id === activeSalonThemeId,
    };
  });
};

exports.createThemePaymentIntent = async (payload) => {
  const { uuid } = payload.salon || {};
  const { theme_uuid } = payload.body || {};

  if (!uuid) {
    throw new error.BadRequest("Salon UUID is required");
  }

  if (!theme_uuid) {
    throw new error.BadRequest("Theme UUID is required");
  }

  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  const theme = await storefrontThemeRepository.findOne({
    uuid: theme_uuid,
    is_active: true,
  });

  if (!theme) {
    throw new error.BadRequest("Theme not found or is currently inactive");
  }

  if (theme.is_free) {
    throw new error.BadRequest("This theme is free and does not require purchase");
  }

  const existingInvoice = await themeInvoiceRepository.findOne({
    salon_id: currentSalon.id,
    theme_id: theme.id,
  });

  if (existingInvoice) {
    if (existingInvoice.status === ThemeInvoiceStatus.ENUM.PAID) {
      throw new error.BadRequest("You have already purchased this theme for lifetime");
    }

    if (existingInvoice.stripe_payment_intent_id) {
      try {
        const intent = await stripe.paymentIntents.retrieve(
          existingInvoice.stripe_payment_intent_id
        );

        if (intent.status === "succeeded") {
          await exports.handleThemePaymentSucceeded(intent);
          return {
            already_paid: true,
            message: "Theme payment already completed and unlocked! Please refresh.",
            theme_uuid: theme.uuid,
            theme_code: theme.code,
            is_purchased: true,
          };
        }

        if (
          ["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(
            intent.status
          )
        ) {
          return {
            clientSecret: existingInvoice.stripe_client_secret || intent.client_secret,
            paymentIntentId: intent.id,
            amount: Number(theme.price),
            currency: theme.currency,
            theme_uuid: theme.uuid,
            theme_code: theme.code,
            theme_name: theme.name,
          };
        }
      } catch (err) {
        console.warn(
          `[Theme Intent] Could not retrieve intent ${existingInvoice.stripe_payment_intent_id}: ${err.message}`
        );
      }
    }

    const amountInPaise = Math.round(Number(theme.price) * 100);
    const idempotencyKey = `theme_pi_${currentSalon.id}_${theme.id}_${crypto.randomUUID()}`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInPaise,
        currency: (theme.currency || "INR").toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: "theme_purchase",
          salon_uuid: currentSalon.uuid,
          salon_id: currentSalon.id.toString(),
          theme_id: theme.id.toString(),
          theme_uuid: theme.uuid,
          theme_code: theme.code,
        },
      },
      { idempotencyKey }
    );

    await themeInvoiceRepository.update({
      payload: {
        status: ThemeInvoiceStatus.ENUM.PENDING,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_client_secret: paymentIntent.client_secret,
        transaction_id: paymentIntent.id,
      },
      criteria: { id: existingInvoice.id },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: Number(theme.price),
      currency: theme.currency,
      theme_uuid: theme.uuid,
      theme_code: theme.code,
      theme_name: theme.name,
    };
  }

  const amountInPaise = Math.round(Number(theme.price) * 100);
  const idempotencyKey = `theme_pi_${currentSalon.id}_${theme.id}_${crypto.randomUUID()}`;

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: amountInPaise,
      currency: (theme.currency || "INR").toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "theme_purchase",
        salon_uuid: currentSalon.uuid,
        salon_id: currentSalon.id.toString(),
        theme_id: theme.id.toString(),
        theme_uuid: theme.uuid,
        theme_code: theme.code,
      },
    },
    { idempotencyKey }
  );

  const pendingInvoiceNumber = `THM-INV-${Date.now().toString().slice(-6)}-${currentSalon.id}`;

  await themeInvoiceRepository.create({
    salon_id: currentSalon.id,
    theme_id: theme.id,
    invoice_number: pendingInvoiceNumber,
    amount: theme.price,
    currency: theme.currency || "INR",
    status: ThemeInvoiceStatus.ENUM.PENDING,
    payment_method: ThemePaymentMethod.ENUM.CARD,
    transaction_id: paymentIntent.id,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_client_secret: paymentIntent.client_secret,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: Number(theme.price),
    currency: theme.currency,
    theme_uuid: theme.uuid,
    theme_code: theme.code,
    theme_name: theme.name,
  };
};

exports.validateThemeOwnership = async (salonId, themeUuid) => {
  if (!themeUuid) {
    throw new error.BadRequest("Theme UUID is required");
  }

  const targetTheme = await storefrontThemeRepository.findOne({
    uuid: themeUuid,
    is_active: true,
  });

  if (!targetTheme) {
    throw new error.BadRequest("Invalid storefront theme selected");
  }

  if (!targetTheme.is_free) {
    let isPaid = await themeInvoiceRepository.findOne({
      salon_id: salonId,
      theme_id: targetTheme.id,
      status: ThemeInvoiceStatus.ENUM.PAID,
    });

    if (!isPaid) {
      const pendingInvoice = await themeInvoiceRepository.findOne({
        salon_id: salonId,
        theme_id: targetTheme.id,
        status: ThemeInvoiceStatus.ENUM.PENDING,
      });

      if (pendingInvoice && pendingInvoice.stripe_payment_intent_id) {
        try {
          const intent = await stripe.paymentIntents.retrieve(
            pendingInvoice.stripe_payment_intent_id
          );
          if (intent.status === "succeeded") {
            await exports.handleThemePaymentSucceeded(intent);
            isPaid = true;
          }
        } catch (err) {}
      }
    }

    if (!isPaid) {
      throw new error.Forbidden(
        "You must purchase this theme before activating it"
      );
    }
  }

  return targetTheme;
};

exports.activateTheme = async (payload) => {
  const { uuid } = payload.salon || {};
  const { theme_uuid } = payload.body || {};

  if (!uuid) {
    throw new error.BadRequest("Salon UUID is required");
  }

  const currentSalon = await salonRepository.findOne({ uuid }, [], {}, {});
  if (!currentSalon) {
    throw new error.BadRequest("Salon not found");
  }

  if (!theme_uuid) {
    throw new error.BadRequest("Theme UUID is required");
  }

  const targetTheme = await exports.validateThemeOwnership(currentSalon.id, theme_uuid);

  await salonRepository.update({
    payload: { storefront_theme_id: targetTheme.id },
    criteria: { id: currentSalon.id },
  });

  return {
    message: "Storefront theme updated successfully",
    theme: {
      id: targetTheme.id,
      uuid: targetTheme.uuid,
      code: targetTheme.code,
      name: targetTheme.name,
      preview_image: targetTheme.preview_image,
    },
    storefront_theme_id: targetTheme.id,
  };
};

exports.handleThemePaymentSucceeded = async (paymentIntent) => {
  const { salon_id, salon_uuid, theme_id, theme_code } = paymentIntent.metadata || {};

  return await themeInvoiceRepository.handleManagedTransaction(
    async (transaction) => {
      const existing = await themeInvoiceRepository.findOne(
        { stripe_payment_intent_id: paymentIntent.id },
        [],
        { transaction }
      );

      if (existing && existing.status === ThemeInvoiceStatus.ENUM.PAID) {
        console.log(
          `[Theme Webhook] PaymentIntent ${paymentIntent.id} already processed. Skipping.`
        );
        return;
      }

      const invoiceNumber =
        existing?.invoice_number ||
        `THM-INV-${Date.now().toString().slice(-6)}-${salon_id || "0"}`;

      if (existing && existing.status === ThemeInvoiceStatus.ENUM.PENDING) {
        await themeInvoiceRepository.update({
          payload: {
            status: ThemeInvoiceStatus.ENUM.PAID,
            transaction_id: paymentIntent.id,
            payment_details: {
              charges: paymentIntent.charges?.data?.[0]?.payment_method_details || null,
              receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
            },
          },
          criteria: { id: existing.id },
          transaction,
        });
      } else if (!existing) {
        try {
          await themeInvoiceRepository.create(
            {
              salon_id: Number(salon_id),
              theme_id: Number(theme_id),
              invoice_number: invoiceNumber,
              amount: paymentIntent.amount / 100,
              currency: (paymentIntent.currency || "INR").toUpperCase(),
              status: ThemeInvoiceStatus.ENUM.PAID,
              payment_method: ThemePaymentMethod.ENUM.CARD,
              transaction_id: paymentIntent.id,
              stripe_payment_intent_id: paymentIntent.id,
              stripe_client_secret: paymentIntent.client_secret,
              payment_details: {
                charges: paymentIntent.charges?.data?.[0]?.payment_method_details || null,
                receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
              },
            },
            { transaction }
          );
        } catch (err) {
          if (err.name === "SequelizeUniqueConstraintError") {
            console.warn(
              `[Theme Webhook] Unique constraint hit for intent ${paymentIntent.id} (already saved).`
            );
          } else {
            throw err;
          }
        }
      }

      console.log(
        `[Theme Webhook] Successfully unlocked theme ${theme_code} for salon ${salon_uuid || salon_id}. Theme is now purchased and ready to be activated by the owner.`
      );
    }
  );
};

exports.handleThemePaymentFailed = async (paymentIntent) => {
  const failureReason =
    paymentIntent.last_payment_error?.message || "Theme payment failed";

  const existing = await themeInvoiceRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
  });

  if (existing) {
    await themeInvoiceRepository.update({
      payload: {
        status: ThemeInvoiceStatus.ENUM.FAILED,
        payment_details: {
          last_payment_error: paymentIntent.last_payment_error || null,
          failure_reason: failureReason,
        },
      },
      criteria: { id: existing.id },
    });
    console.warn(
      `[Theme Webhook] Updated theme invoice status to FAILED for intent ${paymentIntent.id}: ${failureReason}`
    );
  }
};
