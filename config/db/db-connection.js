const { Sequelize } = require("sequelize");
const ora = require('ora-classic');

if (!process.env.NODE_ENV) {
    console.log("NODE_ENV is not defined.");
    process.exit(128);
}
const config = require("./config.js")[process.env.NODE_ENV];
const sequelize = new Sequelize(config);

const checkConnection = async () => {
    const spinner = ora('Checking database connection...').start();
    try {
        await sequelize.authenticate();
        spinner.succeed("Connection has been established successfully.");
        return true;
    } catch (error) {
        spinner.fail(`Failed to establish connection to the database: ${error.message || error}`);
        throw error;
    }
};

module.exports = {
    sequelize,
    checkConnection,
};