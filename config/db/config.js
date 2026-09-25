require("dotenv").config();

const getCaCertificate = () => {
  const envCert =
    process.env.DB_CA_CERT ||
    process.env.CA_CERT ||
    process.env.DB_CA_CERTIFICATE;
  if (envCert) {
    return envCert.replace(/\\n/g, "\n").trim();
  }
  return null;
};

const caCert = getCaCertificate();
const sslConfig = {
  require: true,
  rejectUnauthorized: caCert ? true : false,
  ...(caCert ? { ca: caCert } : {}),
};

const parseDatabaseUrl = (urlStr) => {
  if (!urlStr) return {};
  try {
    const parsed = new URL(urlStr);
    return {
      username: decodeURIComponent(parsed.username || ""),
      password: decodeURIComponent(parsed.password || ""),
      host: parsed.hostname,
      port: parsed.port || 5432,
      database: parsed.pathname.replace(/^\//, ""),
    };
  } catch (e) {
    return {};
  }
};

const parsedDbUrl = parseDatabaseUrl(process.env.DATABASE_URL);

module.exports = {
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 8888,
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
    username: parsedDbUrl.username || process.env.DB_USER,
    password: parsedDbUrl.password || process.env.DB_PASSWORD,
    database: parsedDbUrl.database || process.env.DB_DATABASE,
    host: parsedDbUrl.host || process.env.DB_HOST,
    port: parsedDbUrl.port || process.env.DB_PORT || 5432,
    dialect: "postgres",
    use_env_variable: process.env.DATABASE_URL ? "DATABASE_URL" : undefined,
    url: process.env.DATABASE_URL,
    ...(process.env.DATABASE_URL || process.env.DB_HOST
      ? {
          dialectOptions: {
            ssl: sslConfig,
          },
        }
      : {}),
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    seederStorage: "sequelize",
    logging: false,
    define: {
      underscored: true,
    },
  },
  production: {
    username: parsedDbUrl.username || process.env.DB_USER,
    password: parsedDbUrl.password || process.env.DB_PASSWORD,
    database: parsedDbUrl.database || process.env.DB_DATABASE,
    host: parsedDbUrl.host || process.env.DB_HOST,
    port: parsedDbUrl.port || process.env.DB_PORT || 5432,
    dialect: "postgres",
    use_env_variable: "DATABASE_URL",
    url: process.env.DATABASE_URL,
    dialectOptions: {
      ssl: sslConfig,
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    seederStorage: "sequelize",
    logging: false,
    define: {
      underscored: true,
    },
  },
};
