const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

exports.hashPassword = async (plain) => {
  return await bcrypt.hash(plain, SALT_ROUNDS);
};

exports.comparePassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};
