const { adminUserRepository, salonRepository, subscriptionPlanRepository } = require("../repository");
const { hashPassword, comparePassword } = require("../libs/hash");
const { BadRequest, NotFound, Conflict } = require("../libs/error");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

exports.loginAdmin = async (payload) => {
  const { email, password } = payload.body;

  if (!email || !password) {
    throw new BadRequest("Email and password are required");
  }

  const admin = await adminUserRepository.findByEmailReturnWithPassword(email);

  if (!admin || !admin.is_active) {
    throw new BadRequest("Invalid email or password");
  }

  const isPasswordValid = await comparePassword(password, admin.password);
  if (!isPasswordValid) {
    throw new BadRequest("Invalid email or password");
  }

  const token = jwt.sign(
    { email: admin.email, uuid: admin.uuid, role: admin.role, type: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { email: admin.email, uuid: admin.uuid, role: admin.role, type: "admin" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
    { expiresIn: "7d" },
  );

  return {
    token,
    refreshToken,
    admin: {
      uuid: admin.uuid,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
};

exports.refreshAdminToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new BadRequest("Refresh token required");
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
    );
    if (decoded.type !== "admin") {
      throw new error.Forbidden("Invalid token type");
    }
    const admin = await adminUserRepository.findOne({
      uuid: decoded.uuid,
      is_active: true,
    });
    if (!admin) {
      throw new BadRequest("Admin user not found or inactive");
    }
    const token = jwt.sign(
      { email: admin.email, uuid: admin.uuid, role: admin.role, type: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    return { token };
  } catch (err) {
    throw new BadRequest("Invalid or expired refresh token");
  }
};

exports.listSalons = async (payload) => {
  const {
    page = 1,
    limit = 20,
    status,
    is_active,
    search,
  } = payload.query || {};
  const offset = (Number(page) - 1) * Number(limit);

  const where = {};

  if (status) {
    where.subscription_status = status;
  }

  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { slug: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows: salons, count: total } =
    await salonRepository.model.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [["created_at", "DESC"]],
      attributes: {
        exclude: ["password", "reset_password_token", "reset_token_expiry"],
      },
    });

  return {
    salons,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

exports.createSalon = async (payload) => {
  const {
    name,
    email,
    phone,
    password,
    slug,
    trial_days = 15,
    subscription_plan = "trial",
  } = payload.body;

  if (!name || !email || !password) {
    throw new BadRequest("Salon name, email, and password are required");
  }

  const existingEmail = await salonRepository.findOne({ email });
  if (existingEmail) {
    throw new Conflict("A salon with this email already exists");
  }

  const finalSlug = slug
    ? slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "")
    : name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "");

  const existingSlug = await salonRepository.findOne({ slug: finalSlug });
  if (existingSlug) {
    throw new Conflict(`The web address '${finalSlug}' is already taken`);
  }

  const hashedPassword = await hashPassword(password);
  const trialEndsAt = new Date(
    Date.now() + Number(trial_days) * 24 * 60 * 60 * 1000,
  );

  const newSalon = await salonRepository.create({
    name,
    email,
    phone: phone || null,
    password: hashedPassword,
    slug: finalSlug,
    is_active: true,
    registered_by: "admin",
    subscription_plan,
    subscription_status: "trial",
    trial_ends_at: trialEndsAt,
  });

  return {
    salon: {
      id: newSalon.id,
      uuid: newSalon.uuid,
      name: newSalon.name,
      slug: newSalon.slug,
      email: newSalon.email,
      is_active: newSalon.is_active,
      subscription_status: newSalon.subscription_status,
      trial_ends_at: newSalon.trial_ends_at,
    },
  };
};

exports.updateSalonStatus = async (payload) => {
  const { uuid } = payload.params;
  const { is_active, subscription_status } = payload.body;

  const salon = await salonRepository.findOne({ uuid });
  if (!salon) {
    throw new NotFound("Salon not found");
  }

  const updates = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (subscription_status) updates.subscription_status = subscription_status;

  await salon.update(updates);

  return {
    message: "Salon status updated successfully",
    salon: {
      uuid: salon.uuid,
      name: salon.name,
      slug: salon.slug,
      is_active: salon.is_active,
      subscription_status: salon.subscription_status,
    },
  };
};

exports.updateSalonPlan = async (payload) => {
  const { uuid } = payload.params;
  const {
    subscription_plan,
    subscription_status = "active",
    duration_days,
    extend_trial_days,
    extend_subscription_days,
  } = payload.body;

  const salon = await salonRepository.findOne({ uuid });
  if (!salon) {
    throw new NotFound("Salon not found");
  }

  const updates = {};
  if (subscription_plan) updates.subscription_plan = subscription_plan;
  if (subscription_status) updates.subscription_status = subscription_status;

  if (extend_trial_days) {
    const currentBase =
      salon.trial_ends_at && new Date(salon.trial_ends_at) > new Date()
        ? new Date(salon.trial_ends_at)
        : new Date();
    updates.trial_ends_at = new Date(
      currentBase.getTime() + Number(extend_trial_days) * 24 * 60 * 60 * 1000,
    );
    updates.subscription_status = "trial";
  }

  if (extend_subscription_days) {
    const now = new Date();
    const currentBase =
      salon.subscription_expires_at &&
      new Date(salon.subscription_expires_at) > now
        ? new Date(salon.subscription_expires_at)
        : now;
    updates.subscription_expires_at = new Date(
      currentBase.getTime() +
        Number(extend_subscription_days) * 24 * 60 * 60 * 1000,
    );
    updates.subscription_status = "active";
  } else if (duration_days) {
    updates.subscription_expires_at = new Date(
      Date.now() + Number(duration_days) * 24 * 60 * 60 * 1000,
    );
    updates.subscription_status = "active";
  }

  await salon.update(updates);

  return {
    message: "Salon subscription plan updated successfully",
    salon: {
      uuid: salon.uuid,
      name: salon.name,
      slug: salon.slug,
      subscription_plan: salon.subscription_plan,
      subscription_status: salon.subscription_status,
      trial_ends_at: salon.trial_ends_at,
      subscription_expires_at: salon.subscription_expires_at,
    },
  };
};

exports.getSubscriptionPlans = async () => {
  const plans = await subscriptionPlanRepository.model.findAll({
    where: { is_active: true },
    order: [["id", "ASC"]],
  });

  return plans.map((plan) => {
    const numAmount = Number(plan.amount);
    const formatted_price =
      numAmount === 0
        ? "Free"
        : `₹${numAmount.toLocaleString("en-IN")}`;

    return {
      id: plan.code,
      db_id: plan.id,
      code: plan.code,
      name: plan.name,
      amount: numAmount,
      formatted_price,
      currency: plan.currency || "INR",
      billing_cycle: plan.billing_cycle,
      badge: plan.badge,
      description: plan.description,
      is_active: plan.is_active,
    };
  });
};

exports.updateSubscriptionPlan = async (payload) => {
  const { code } = payload.params;
  const { amount, name, description, badge, billing_cycle } = payload.body;

  const plan = await subscriptionPlanRepository.findOne({ code });
  if (!plan) {
    throw new NotFound(`Subscription plan '${code}' not found`);
  }

  const updates = {};
  if (amount !== undefined) {
    if (isNaN(Number(amount)) || Number(amount) < 0) {
      throw new BadRequest("Amount must be a non-negative number");
    }
    updates.amount = Number(amount);
  }
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (badge !== undefined) updates.badge = badge;
  if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle;

  await plan.update(updates);

  const numAmount = Number(plan.amount);
  const formatted_price =
    numAmount === 0
      ? "Free"
      : `₹${numAmount.toLocaleString("en-IN")}`;

  return {
    message: "Subscription plan updated successfully",
    plan: {
      id: plan.code,
      db_id: plan.id,
      code: plan.code,
      name: plan.name,
      amount: numAmount,
      formatted_price,
      currency: plan.currency || "INR",
      billing_cycle: plan.billing_cycle,
      badge: plan.badge,
      description: plan.description,
      is_active: plan.is_active,
    },
  };
};
