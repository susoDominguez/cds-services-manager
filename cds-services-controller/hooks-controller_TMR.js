"use strict";
const logger = require("../config/winston");
const {
  simpleCigsListMerge,
} = require("../hooks-module/tmr_hooks/simpleCigsMerge_hook");
const { 
  aggregateDataFromTmr
} = require("../data-aggregator-controller_module/cig-aggregate_TMR");

exports.getServicesFromTmr = async function (req, res, next) {
  //get input data
  const hookId = res.locals.hook;
  const cigTool = "tmr";

  logger.info(`hookID is ${hookId}`);

  //data Map
  const hookEntries = res.locals.entries;

  //response variable to add to parameter res
  let response;

  switch (hookId) {
    default:
      // case "DB-HT-OA-merge": case "multimorbidity-merge":
      //process data
      let {patientId,encounterId,cigId,mergedCig,interactions} = await simpleCigsListMerge(hookEntries)
        
      let aggregatedForm = await aggregateDataFromTmr(cigId,mergedCig,interactions);
      //logger.info(`aggregatedForm is ${JSON.stringify(aggregatedForm)}`);
      response = {patientId, encounterId, cigId, aggregatedForm};
      break;
  }
  //add response to res.locals.cdsData for next function
  res.locals.cdsData =  response;
  //call next function
  next();
};
