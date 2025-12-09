require('dotenv').config();
global.argv = process.argv.slice(2);
global.port = global.argv[0] || process.env.APP_PORT;

if (!global.port) {
    console.log('port is not defined. argv = ', global.argv);
    process.exit(128);
}

const express = require('express');
const cors = require('cors');
const { errorMiddleware } = require('./middlewares');
const { checkConnection } = require('./config/').dbConnection;
const cookieParser = require('cookie-parser');


const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : [];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow Postman, server-to-server
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Routes declaration
app.use('/', require('./routes'));

// Handle 404 - Route not found
app.use((req, res, next) => {
    res.status(404).json({ error: "Resource not found" });
});

app.use(errorMiddleware);


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
