"use strict";
const { ErrorHandler } = require("../lib/errorHandler");
const logger = require("../config/winston");
const { setCdsCardsFrom_copdAssess } = require("./TMR2FHIRconverter/copd-assess_2_FHIR");
const { setCdsCard_NonMitigation } = require("./TMR2FHIRconverter/tmr2fhir_noArg");
const { setCdsCard } = require("./TMR2FHIRconverter/tmr2fhir-component");


module.exports = {

  getCopdAssessCdsCards: async function (req, res, next) {
    //response variable 
    let aCdsCard;

    //get input data
    const hookId = res.locals.hook;
    const { patient = 'dummy', groupA, groupB, groupC, groupD, assessedCopdGroup_code } = res.locals.cdsData;

    switch (hookId) {
      default: //case "copd-assess"
      aCdsCard = setCdsCardsFrom_copdAssess({ patient , groupA, groupB, groupC, groupD, assessedCopdGroup_code });
        break;
    }
    //add CDS Cards response to parameter res
    res.locals.cdsData = aCdsCard;
    //next function
    next();
  },

  /**
   * convert TMR-based CIG to FHIR instances
   * @param {object} req 
   * @param {object} res 
   * @param {object} next 
   */
  getTmrCdsCards: async function (req, res, next) {

    //response variable 
    let aCdsCard ;

    //get input data
    const hookId = res.locals.hook;
    const { patientId, encounterId, cigId, aggregatedForm, extensions } = res.locals.cdsData;

    //logger.info(`aggregated TMR form is ${JSON.stringify({ patientId, encounterId, cigId, aggregatedForm })}`);

    //some hooks may need specific mappings
    switch (hookId) {
      default: //case "DB-HT-OA-merge": case "multimorbidity-merge":
      //if mitigation service is plugged
      if(extensions !== null) {
        aCdsCard = setCdsCard({ patientId, encounterId, cigId, aggregatedForm, extensions });
      } else {
              //otherwise
          aCdsCard = setCdsCard_NonMitigation({ patientId, encounterId, cigId, aggregatedForm });
      }
        break;
    }

    //add CDS Cards response to parameter res
    res.locals.cdsData = aCdsCard;
    //next function
    next();
  }
  

};