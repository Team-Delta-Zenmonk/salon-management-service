const RESERVED_SLUGS = new Set([
  "admin",
  "app",
  "api",
  "www",
  "storefront",
  "dashboard",
  "support",
  "billing",
  "mail",
  "email",
  "blog",
  "help",
  "auth",
  "login",
  "signup",
  "register",
  "zenmonk",
  "portal",
  "root",
  "static",
  "assets",
  "cdn",
  "staging",
  "dev",
  "test",
  "status",
  "docs",
]);

const isReservedSlug = (slug) => {
  if (!slug) return false;
  return RESERVED_SLUGS.has(String(slug).toLowerCase().trim());
};

module.exports = {
  RESERVED_SLUGS,
  isReservedSlug,
};
