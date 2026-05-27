const stripe = require("../config/stripe");
const { error } = require("../libs");
const { salonRepository } = require("../repository");

exports.createOnboardingLink = async (salonId) => {
  const salon = await salonRepository.findOne({ id: salonId });
  const managementAppUrl = process.env.MANAGEMENT_APP_URL;
  if (!salon) {
    throw new error.NotFound("Salon not found");
  }

  let accountId = salon.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: salon.email,
      business_type: "company",
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        name: salon.name,
      },
    });

    accountId = account.id;

    await salonRepository.update({
      payload: { stripe_account_id: accountId },
      criteria: { id: salonId },
    });
  }
  
 const accountLink = await stripe.accountLinks.create({
   account: accountId,
   refresh_url: `${managementAppUrl}/dashboard`,
   return_url: `${managementAppUrl}/dashboard?stripe_onboarded=true`,
   type: "account_onboarding",
 });

 return { url: accountLink.url };
};


exports.createDashboardLoginLink = async (salonId) => {
  const salon = await salonRepository.findOne({ id: salonId });
  if (!salon) {
    throw new error.NotFound("Salon not found");
  }

  if (!salon.stripe_account_id) {
    throw new error.BadRequest("Salon is not connected to Stripe");
  }

  const loginLink = await stripe.accounts.createLoginLink(salon.stripe_account_id);

  return { url: loginLink.url };
};
