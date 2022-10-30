"use strict";
const mongoose = require('mongoose');
const logger = require("../config/winston");
const {templateSchema} = require("./mongoose_schemas");

const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_CIG_MODEL,
  MONGODB_TEMPLATES
} = process.env;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 8,
  //reconnectTries: Number.MAX_VALUE,
  //reconnectInterval: 500,
  connectTimeoutMS: 10000,
};


//HOST and PORT of MONGODB
const host = MONGODB_HOST || "localhost";
const port = MONGODB_PORT || "27017";
const tmr_model_name = MONGODB_CIG_MODEL || "tmr";
const templates_collection = ( MONGODB_TEMPLATES || "templates" );


//create a new DB connection
function makeNewConnection(uri) {
   
  const db = mongoose.createConnection(uri, options);

  db.on("error", function (error) {
    logger.error.bind(
      `MongoDB :: connection ${this.name} ${JSON.stringify(error)}`
    );
    db.close().catch(() =>
      logger.error(`MongoDB :: failed to close connection ${this.name}`)
    );
  });

  db.on("connected", function () {
    mongoose.set("debug", function (col, method, query, doc) {
      logger.info(
        `MongoDB :: ${this.conn.name} ${col}.${method}(${JSON.stringify(
          query
        )},${JSON.stringify(doc)})`
      );
    });
    logger.info(`MongoDB :: connected ${this.name}`);
  });

  db.on("disconnected", function () {
    logger.info(`MongoDB :: disconnected ${this.name}`);
  });

  return db;
}

const tmrDbConnection = makeNewConnection( `mongodb://${host}:${port}/${tmr_model_name}-db`);

const Templates = tmrDbConnection.model("Templates", templateSchema, templates_collection);


module.exports = { Templates };



