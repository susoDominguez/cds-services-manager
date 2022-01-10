"use strict";
const {getMapValue} = require("../../cds-services-controller/core_functions")
const {
  patient, cigsList, encounterId
} = require("../../database_modules/constants.js");
const logger = require("../../config/winston");
const {fetchTmrData} = require("./setTmrData")

/**
 * 
 * @param {Map<string,object>} entries Map of hook-related entries
 * @returns object containig patient Id, encounter Id, cig UUID, TMR object with merged CIG and identified interactions
 */
exports.simpleCigsListMerge = async (entries) => {
    //var to hold tmr object
    let response = {
        patientId: "dummy patient",
        encounterId: "dummy encounter",
        cigId: null,
        mergedCig: null,
        interactions: null
      };


    //list of CIGs to merge. MAndatory even when empty list is expected.
    let involvedCigsList = getMapValue(cigsList, entries);
    //remove the entry
    entries.delete(cigsList);

    //extract patientId and set
    if(entries.has(patient)) {
        response[patient] = getMapValue(patient,entries);
    //remove patientId
    entries.delete(patient);
    }
    

    if(entries.has(encounterId)) {
    //extract encounterId and set
    response[encounterId] = getMapValue(encounterId,entries);
    //remove encounterId
    entries.delete(encounterId);
    }

    //at this point, each entry left has data to combine TMR-based CIGs, 
    //that is, the cigList field value is not empty

    //call setTmrData component
    const { cigId, mergedCig, interactions } = await fetchTmrData(involvedCigsList,entries);
    //logger.info(`cigId is ${JSON.stringify(cigId)}`);
    //logger.info(`mergedCig is ${JSON.stringify(mergedCig)}`);
    //set response
    response.cigId = cigId;
    response.mergedCig = mergedCig;
    response.interactions = interactions;
    
    //return response object
    return response;
};