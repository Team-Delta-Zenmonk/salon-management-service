require("dotenv").config();

module.exports = {
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: "postgres",
    seederStorage: "sequelize",
    logging: console.log,
    define: {
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "db-test",
    host: process.env.DB_HOST,
    dialect: "postgres",
    seederStorage: "sequelize",
    logging: false,
    define: {
      underscored: true,
    },
  },
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    seederStorage: "sequelize",
    logging: false,
    define: {
      underscored: true,
    },
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    seederStorage: "sequelize",
    logging: false,
    define: {
      underscored: true,
    },
  },
};
