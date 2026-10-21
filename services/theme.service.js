const crypto = require("crypto");
const stripe = require("../config/stripe");
const error = require("../libs/error");
const {
  salonRepository,
  storefrontThemeRepository,
  invoiceRepository,
} = require("../repository");
const {
  InvoiceType,
  InvoicePaymentStatus,
} = require("../models/invoice/invoice-types");
const { enqueueInvoiceJob } = require("../jobs/invoice.worker");

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

  const paidInvoices = await invoiceRepository.findAll({
    criteria: {
      salon_id: currentSalon.id,
      invoice_type: InvoiceType.ENUM.THEME,
      payment_status: InvoicePaymentStatus.ENUM.PAID,
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

  const existingInvoice = await invoiceRepository.findOne({
    salon_id: currentSalon.id,
    theme_id: theme.id,
    invoice_type: InvoiceType.ENUM.THEME,
  });

  if (existingInvoice) {
    if (existingInvoice.payment_status === InvoicePaymentStatus.ENUM.PAID) {
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

    await invoiceRepository.update({
      payload: {
        payment_status: InvoicePaymentStatus.ENUM.PENDING,
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

  await invoiceRepository.create({
    invoice_number: pendingInvoiceNumber,
    invoice_type: InvoiceType.ENUM.THEME,
    salon_id: currentSalon.id,
    theme_id: theme.id,
    grand_total: theme.price,
    amount_paid: 0,
    balance_due: theme.price,
    currency: theme.currency || "INR",
    payment_status: InvoicePaymentStatus.ENUM.PENDING,
    payment_method: "card",
    transaction_id: paymentIntent.id,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_client_secret: paymentIntent.client_secret,
    issued_at: new Date(),
    metadata: {
      theme_name: theme.name,
      theme_code: theme.code,
    },
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
    let isPaid = await invoiceRepository.findOne({
      salon_id: salonId,
      theme_id: targetTheme.id,
      invoice_type: InvoiceType.ENUM.THEME,
      payment_status: InvoicePaymentStatus.ENUM.PAID,
    });

    if (!isPaid) {
      const pendingInvoice = await invoiceRepository.findOne({
        salon_id: salonId,
        theme_id: targetTheme.id,
        invoice_type: InvoiceType.ENUM.THEME,
        payment_status: InvoicePaymentStatus.ENUM.PENDING,
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

  await invoiceRepository.handleManagedTransaction(
    async (transaction) => {
      const existing = await invoiceRepository.findOne(
        { stripe_payment_intent_id: paymentIntent.id, invoice_type: InvoiceType.ENUM.THEME },
        [],
        {},
        { transaction }
      );

      if (existing && existing.payment_status === InvoicePaymentStatus.ENUM.PAID) {
        console.log(
          `[Theme Webhook] PaymentIntent ${paymentIntent.id} already processed. Skipping.`
        );
        return;
      }

      const invoiceNumber =
        existing?.invoice_number ||
        `THM-INV-${Date.now().toString().slice(-6)}-${salon_id || "0"}`;

      const totalAmount = paymentIntent.amount / 100;

      if (existing && existing.payment_status === InvoicePaymentStatus.ENUM.PENDING) {
        await invoiceRepository.update({
          payload: {
            payment_status: InvoicePaymentStatus.ENUM.PAID,
            amount_paid: totalAmount,
            balance_due: 0,
            transaction_id: paymentIntent.id,
            payment_details: {
              charges: paymentIntent.charges?.data?.[0]?.payment_method_details || null,
              receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
            },
          },
          criteria: { id: existing.id },
          options: { transaction },
        });
      } else if (!existing) {
        try {
          await invoiceRepository.create(
            {
              invoice_number: invoiceNumber,
              invoice_type: InvoiceType.ENUM.THEME,
              salon_id: Number(salon_id),
              theme_id: Number(theme_id),
              grand_total: totalAmount,
              amount_paid: totalAmount,
              balance_due: 0,
              currency: (paymentIntent.currency || "INR").toUpperCase(),
              payment_status: InvoicePaymentStatus.ENUM.PAID,
              payment_method: "card",
              transaction_id: paymentIntent.id,
              stripe_payment_intent_id: paymentIntent.id,
              stripe_client_secret: paymentIntent.client_secret,
              issued_at: new Date(),
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

  const paidInvoice = await invoiceRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
    invoice_type: InvoiceType.ENUM.THEME,
  });
  if (paidInvoice) {
    enqueueInvoiceJob(paidInvoice.id).catch((err) =>
      console.error(`[Theme Webhook] Failed to enqueue invoice job:`, err.message)
    );
  }
};

exports.handleThemePaymentFailed = async (paymentIntent) => {
  const failureReason =
    paymentIntent.last_payment_error?.message || "Theme payment failed";

  const existing = await invoiceRepository.findOne({
    stripe_payment_intent_id: paymentIntent.id,
    invoice_type: InvoiceType.ENUM.THEME,
  });

  if (existing) {
    await invoiceRepository.update({
      payload: {
        payment_status: InvoicePaymentStatus.ENUM.FAILED,
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
