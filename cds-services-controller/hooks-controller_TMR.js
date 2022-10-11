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
  const cigsList = res.locals.cigsList;
  const cigTool = "tmr";

  logger.info(`hookID is ${hookId}`);

  //data Map of form {key -> {value, activeCIG}}
  const hookEntries = res.locals.entries;

  //response variable to add to parameter res
  let response;

  switch (hookId) {
    default:
      // default cases are built uniquely with parameters from cds hooks manager that has a value and a collection of subguidelines
      //process data
      let {patientId,encounterId,cigId,mergedCig,interactions} = await simpleCigsListMerge(hookEntries, cigsList)
        
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
