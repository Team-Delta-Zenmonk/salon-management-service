const { ENUM } = require("../common/enum");

class AdminRole extends ENUM {
  static ENUM = {
    SUPER_ADMIN: "super_admin",
    SUPPORT: "support",
  };
}

exports.AdminRole = AdminRole;
