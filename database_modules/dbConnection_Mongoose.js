"use strict";

const mongoose = require('mongoose');
const logger = require("../config/winston");

const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_TEMPLATES,
  MONGODB_CIG_MODEL
} = process.env;

const {templateSchema} = require("./mongoose_schemas");


const db_host = ( MONGODB_HOST || "localhost");
const db_port = ( MONGODB_PORT || "27017" );
const templates_collection = ( MONGODB_TEMPLATES || "templates" );
const db_name = ( (MONGODB_CIG_MODEL + '-db') || "tmr-db" );

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 8,
  //reconnectTries: Number.MAX_VALUE,
  //reconnectInterval: 500,
  connectTimeoutMS: 10000
};

const url = `mongodb://${db_host}:${db_port}/${db_name}`;
//const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${db_host}:${db_port}/${db_name}?authSource=admin`;


//Below we instantiate each pre-defined Collection with its associated model

//linked to the template collection
const TMR_COLLECTION = mongoose.model("TemplateTMR", templateSchema, templates_collection );

let _conn;

  /**
   *  Mongo utility to connect to client
   */
module.exports = {
  
  initDb : () => {
    const _db = mongoose
                .connect(url, options);

     _conn = mongoose.connection;

    _conn.on("error", () => {
      logger.error.bind(logger, "Connection error");
    });
    _conn.once("open", () => console.log("db connection open"));
    _conn.once("connected", () => {
      console.log("Connection Established");
    });

    return _db;
  },
  TMR_COLLECTION,
  /***
   * @returns {mongoose.Connection}
   */
  getConn : (collection) => {
    return _conn;
  }
}


