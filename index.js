require('dotenv').config();
global.argv = process.argv.slice(2);
global.port = global.argv[0] || process.env.APP_PORT;

if (!global.port) {
    console.log('port is not defined. argv = ', global.argv);
    process.exit(128);
}

const express = require('express');
const cors = require('cors');
const { checkConnection } = require('./config/').dbConnection;


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
    res.send('Salon Management Service is running');
});

process.on('uncaughtException', (err) => {
    console.log('uncaught exception', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandled rejection', reason);
});

if (process.env.NODE_ENV !== "test") {
    checkConnection()
        .then(() => {
            app.listen(global.port, () => {
                const NODE_ENV = process.env.NODE_ENV;
                console.log(`${NODE_ENV} Server is listening on port ${global.port}`);
            });
        }).catch(err => {
            console.error('Unable to connect to the database:', err);
            console.error('Cancelling app server launch');
        });
}

module.exports = app;
