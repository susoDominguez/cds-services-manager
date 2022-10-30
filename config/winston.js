var winston = require('winston');
require('winston-mongodb');

const { MONGODB_HOST, MONGODB_PORT, LOGS, MONGODB_CIG_MODEL } = process.env;

const db_host = MONGODB_HOST || "localhost";
const db_port = MONGODB_PORT || "27017";
const logs_collection_name = LOGS || "cds_sm_log";
const db_name = (MONGODB_CIG_MODEL + "-db") || "tmr-db";
const url = `mongodb://${db_host}:${db_port}/${db_name}`;
// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: "info",
    filename: `app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: "debug",
    handleExceptions: true,
    json: true,
    colorize: true,
  },
  mongodb: {
    level: "error",
    //mongo database connection link
    db: url,
    options: {
      useUnifiedTopology: true,
    },
    // A collection to save json formatted logs
    collection: logs_collection_name,
    storeHost: true,
    format: winston.format.combine(
      winston.format.timestamp(),
      // Convert logs to a json format
      winston.format.json()
    ),
  },
};

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
    new winston.transports.MongoDB(options.mongodb),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function (message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;
