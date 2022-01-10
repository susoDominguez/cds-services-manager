"use strict";
const { ErrorHandler } = require("../lib/errorHandler");
const logger = require("../config/winston");
const { assess_copd } = require("../hooks-module/non-cig-hooks/copd-assess-module");

module.exports = {

  getServices: async function (req, res, next) {
    //get input data
    const hookId = res.locals.hook;
    logger.info(`hookID is ${hookId}`);
    
    //data Map
    const hookEntries = res.locals.entries;
    
    //response variable to add to parameter res
    let response;

    switch (hookId) {
      default://case "copd-assess":
      //process data
      response = assess_copd(hookEntries);
        break;
    }
    //add CDS Cards response to parameter res
    res.locals.cdsData = response;

    next();
  }

};