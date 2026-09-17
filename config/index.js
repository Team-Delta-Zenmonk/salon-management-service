module.exports = {
  dbConnection: require("./db/db-connection"),
  mailConfig: require("./mail/config"),
  cloudinary: require("./cloudinary/config"),
  initPresets: require("./cloudinary/init-presets").syncPresets,
};
