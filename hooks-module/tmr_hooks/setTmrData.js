"use strict";

const {
  TMR_CIG_CREATE,
  TMR_CIG_DELETE,
  TMR_CIG_ADD,
  TMR_CIG_GET,
  TMR_CIGS_INTERACTIONS,
  INTERACTION_HOST,
  INTERACTION_PORT,
  INTERACTION_DB,
  ARGUMENTATION_ENGINE_URL
} = process.env;

const {
  paramValue, ciglist
} = require("../../database_modules/constants.js");
const axios = require("axios");
const qs = require("querystring");
const logger = require("../../config/winston");
const { ErrorHandler } = require("../../lib/errorHandler");

//building TMR Web URL
const tmr_url = "http://" + (INTERACTION_HOST || 'localhost') + ":" + (INTERACTION_PORT || '8888') + "/" + (INTERACTION_DB || 'tmrweb');
  //argumentation engine
const resolution_url = ARGUMENTATION_ENGINE_URL ? "https://" + ARGUMENTATION_ENGINE_URL : null;

let config = {
  method: "post",
  url: null,
  headers: {
    "Content-Type": null,
  },
  data: null,
};

//create a non persistent dataset in Jena using Fuseki
async function createCigRemotely() {
  let data = qs.stringify({
    cig_id: Date.now(),
    IsPersistent: "false",
  });

  let configCreate = JSON.parse(JSON.stringify(config));
  configCreate.url = tmr_url + "/" + (TMR_CIG_CREATE || `guideline/create`);
  configCreate.headers["Content-type"] = "application/x-www-form-urlencoded";
  configCreate.data = data;

  return axios(configCreate);
}

//delete a non persistent dataset in Jena using Fuseki
async function deleteCigRemotely(cig_id) {
  let data = qs.stringify({
    cig_id: cig_id,
  });

  let configDelete = JSON.parse(JSON.stringify(config));
  configDelete.url = tmr_url + "/" + (TMR_CIG_DELETE || `guideline/delete`);
  configDelete.headers["Content-type"] = "application/x-www-form-urlencoded";
  configDelete.data = data;

  //delete. If it does not succeed is Ok as labels are unique so there will be no clashing with other temporary datasets
  return axios(configDelete);
}

async function addSubCigs(cig_from, cig_to, subCigs) {

  let data = qs.stringify({
    cig_from: cig_from,
    cig_to: cig_to,
    //subCIGs could be empty array
    subguidelines: subCigs.toString()
  });

  let configAdd = JSON.parse(JSON.stringify(config));
  configAdd.url = tmr_url + "/" + (TMR_CIG_ADD || 'guidelines/add');
  configAdd.headers["Content-type"] = "application/x-www-form-urlencoded";
  configAdd.data = data;

  return axios(configAdd);
}

async function getInteractions(cig_id) {
  let data = qs.stringify({
    cig_id: cig_id,
  });

  let configInter = JSON.parse(JSON.stringify(config));
  configInter.url = tmr_url + "/" + (TMR_CIGS_INTERACTIONS || 'guidelines/interactions');
  configInter.headers["Content-type"] = "application/x-www-form-urlencoded";
  configInter.data = data;

  return axios(configInter);
}

async function getMergedCig(cig_id) {
  let data = qs.stringify({
    cig_id: cig_id,
  });

  let configRecs = JSON.parse(JSON.stringify(config));
  configRecs.url = tmr_url + "/" + (TMR_CIG_GET || 'guidelines/cig/get');
  configRecs.headers["Content-type"] = "application/x-www-form-urlencoded";
  configRecs.data = data;

  return axios(configRecs);
}

async function callResolutionEngine(argsObj) {

  let configArgEngine = JSON.parse(JSON.stringify(config));
  configArgEngine.url = resolution_url;
  configArgEngine.headers["Content-type"] = "application/json";
  configArgEngine.data = JSON.stringify(argsObj);

  return axios(configArgEngine);
}

/**
 * Calls TMR processing microservices to merge (parts of) involved CIGs and identify interactions among them.
 * @param {Array} involvedCigsList List of CIGs to be activated
 * @param {Map<string,object>} parametersMap Map of hook-related entries where entry values are objects with 2 fields of type Array: data and cigList
 * @returns object of form {cigId, mergedCig, interactions}
 */
exports.fetchTmrData = async function (involvedCigsList, parametersMap) {

  //response object to contain data which will be pass to the next middleware (cigId | patientId | TMR json object)
  let response = {
    cigId: null,
    mergedCig: null,
    interactions: null
  };

  //cig identifier and status of creating CIG remotely
  let cig_to, statusCreatedCig;

  //main function to add Recommendations from Subguidelines into a temp CIG remotely
  try {
    //create a temp CIG
    const dataset = await createCigRemotely();

    //status of creating CIG
    statusCreatedCig = dataset.status; 

    //check dataset is created otherwise fail
    if (statusCreatedCig !== 200)
      throw new ErrorHandler(500,
        "Remote TMR dataset was not successfully created. Status is " +
          statusCreatedCig
      );

    //get temp cig IDENTIFIER from result {cig_id: "id"}
    cig_to = "" + dataset.data.cig_id;

    //add cig label to response local var
    response["cigId"] = cig_to;

    //combine subguidelines from one CIG and await until they are done
    for (const aCig of involvedCigsList) {

      logger.info(`adding subguidelines for CIG: ${aCig}`);

      //create list of sub-guideline identifiers from outcomes in
      let subCigStringList = new Array();

      //value object must contain fields value and activeCIG of type List for TMR processing tool
      for (let valObj of parametersMap.values()) {

        //check object hasfield 'value'
        if(!valObj[paramValue] ) 
          throw new ErrorHandler(500, `processing subguidelines for CIG ${aCig}: expected object is missing property "value".`);
        //process only those parameters that have one or more active CIGs
        if(!valObj[ciglist] || ciglist.length < 1) continue;

        //list of CIGs
        let cigsArr  = valObj[ciglist];
        //data value 
        let dataArr = valObj[paramValue];
        //add subguidelines to guideline CIG
        if (cigsArr.includes(aCig))
          if(Array.isArray(dataArr)) {
          //push subcig if nott an array
          Array.prototype.push.apply(subCigStringList, dataArr);
          } else {
            subCigStringList.push(dataArr);
          }
      }

      //flatten results
      //subCigStringList = subCigStringList.flat(1);
      //logger.info("subCigStringList is " + subCigStringList.toString());

      //add relevant recommendations to mergedCIG
      let cigsAddedResult = await addSubCigs(aCig, cig_to, subCigStringList);

      //if OK, status should be: 204 - no content
      if (cigsAddedResult.status > 204)
        throw new ErrorHandler(500,
          "subCIGs (" +
            JSON.stringify(subCigStringList) +
            ") were not added from " +
            aCig +
            " to " +
            cig_to +
            ". Status is " +
            stat
        );
    }

    //fetch interactions
    let interactionsPromise = getInteractions(cig_to);

    //fetch recommendations
    let cigPromise = getMergedCig(cig_to);

    //resolve promises
    let [interObj, recObj] = await Promise.all([
      interactionsPromise,
      cigPromise,
    ]);
    //get their data
    response.interactions = interObj.data ? interObj.data : [];
    response.mergedCig = recObj.data ? recObj.data : [];

  } catch(error){
    logger.error(`error when accessing TMRWebX: ${JSON.stringify(error)}`);
    
    if(error) throw new ErrorHandler(
      500,
      error.message
    )
  } finally {
    //if temporary dataset was created, delete it
    if (statusCreatedCig === 200) {
      try {
        deleteCigRemotely(cig_to);
      } catch (error) {
        logger.error(
          "error when attempting to delete temporary dataset: \n" + error
        );
      }
    }
    //return TMR data
    return response;
  }
};

exports.callMitigationService = async function (argTemplateBody) {


    //call argumentation machine//

    //send TEMPLATES_COPD to resolution engine.
    let argumentationResponse = await callResolutionEngine(argTemplateBody);
    let outputResolution = argumentationResponse.data;
     //logger.info(`outputResolution is ${outputResolution}`);
    //get its data
    if (
      !outputResolution.hasOwnProperty("extensions")
    ) {
      logger.error(
        `argumentation engine is missing expected property 'extensions'`
      );
      throw new ErrorHandler(500,
        `argumentation engine is missing expected property 'extensions'`
      );
      
    } 
    // ENDS ARGUMENTATION WORKFLOW
    return  outputResolution["extensions"];
};
