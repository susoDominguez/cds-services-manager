"use strict";
const { ErrorHandler } = require("../lib/errorHandler");
const logger = require("../config/winston");
//const axios = require("axios");
const {getMapValue} = require("../cds-services-controller/core_functions");
const qs = require("querystring");
const { Templates } = require("../database_modules/dbConnection");
const {
  callMitigationService,
} = require("../hooks-module/tmr_hooks/setTmrData");
const { ARGUMENTATION_HOST }= process.env;
const {
  paramName,
  labelTemplate,
  bodyTemplate,
  addTemplate,
  fields,
  aPath,
  entryField,
  entryTemplate,
} = require("../database_modules/constants.js");

//configuration for request call
let config = {
  method: "post",
  url: "",
  headers: {
    "Content-Type": "",
  },
  data: "",
};
//labels for templates
const cig_interactions_label = "json-template", cig_conflict_label = "argumentation-template";

/**
 * Given a list of paths, walk through object until encounter last given field then add value to it
 * @param {Array} pathList list of path objects to traverse
 * @param {object} val any value, including arrays
 * @param {object} aggregatedForm object to be updated at paths with value(s)
 */
function traverseAndUpdateObjectWithPath(pathList, val, aggregatedForm) {
  //for each path, act (check whether acting on array)
  for (const aPathObject of pathList) {
    //check it has the field
    if (aPathObject.hasOwnProperty(aPath)) {
      //get String path from the Object labelled as constant 'aPath' determines
      let aPathString = aPathObject[aPath];
      //split string at dots into a comma separated list of fields to traverse
      let propertyList = aPathString.split(".");

      //json object to iterate over
      let aField = aggregatedForm;

      //loop over properties of query object until the last one. Dont traverse the last one
      for (let index = 0; index < propertyList.length - 1; index++) {
        //property to traverse
        const propLabel = propertyList[index];

        if (aField.hasOwnProperty(propLabel)) {
          aField = aField[propLabel];
          // logger.info(`aField currently is ${JSON.stringify(aField)}`);
        } else {
          logger.error(
            `Name ${propLabel} of property is not found in the given object ${JSON.stringify(
              aggregatedForm
            )} at function traverseAndUpdateObjectWithPath`
          );
          throw `Name ${propLabel} of property is not found in the given object ${JSON.stringify(
            aggregatedForm
          )} at function traverseAndUpdateObjectWithPath`;
        }
      }

      //Now add value to the last property in the list
      let lstPropLabel = propertyList[propertyList.length - 1];

      if (aField.hasOwnProperty(lstPropLabel)) {
        // logger.info(`aField currently is ${JSON.stringify(aField[lstPropLabel])}`);
        //add value to field depending on the type of field.
        //If arrray, test whether value to be added is also array. If so, join arrays instead of replacing.
        if (Array.isArray(aField[lstPropLabel])) {
          if (Array.isArray(val)) {
            //if empty, avoid concat
            if (val === []) {
              aField[lstPropLabel] = val;
            } else {
              aField[lstPropLabel] = aField[lstPropLabel].concat(val);
            }
          } else {
            aField[lstPropLabel].push(val);
          }
        } else {
          //if a string
          if (typeof aField[lstPropLabel] === "string") {
            //if string is not empty or null or undefined
            aField[lstPropLabel]
              ? (aField[lstPropLabel] += val)
              : (aField[lstPropLabel] = val);
          }
        }
      } else {
        logger.error(
          `Name ${lstPropLabel} of property is not found in the given object ${JSON.stringify(
            aggregatedForm
          )} at function traverseAndUpdateObjectWithPath`
        );
        throw `Name ${lstPropLabel} of property is not found in the given object ${JSON.stringify(
          aggregatedForm
        )} at function traverseAndUpdateObjectWithPath`;
      }
    } else {
      logger.error(
        "traverseAndUpdateObjectWithPath: object has no aPath constant labelled as " +
          aPath
      );
      throw Error(
        "traverseAndUpdateObjectWithPath: object has no aPath constant labelled as " +
          aPath
      );
    }
  }
}

/**
 * sets and returns aggregatedForm
 * @param {string} cigId cig id
 * @param {object} recommendations cig recommendations
 * @param {object} interactions interactions
 * @param {Array} pathActionsList path actioins list
 * @param {object} aggregatedForm merged cig form
 */
function setDataTemplate(
  cigId,
  recommendations,
  interactions,
  pathActionsList,
  aggregatedForm
) {
  //loop over parameters of 'add field in template
  for (const obj of pathActionsList) {
    //template vars
    let paramVal = obj[paramName];
    let fieldList = obj[fields];
    //label of field
    let entry_field;
    //object to be filled in with data
    let entry_templ;

    if (obj.hasOwnProperty(entryField) && obj.hasOwnProperty(entryTemplate)) {
      entry_templ = obj[entryTemplate];
      entry_field = obj[entryField];
    }

    //value to be added
    let propertyLabel;
    //FHIR-based extracted data: vars
    let paramLabelData,
      resultObj,
      dataArr;
    //value to be added
    let val;

    switch (paramVal) {
      //add cig id to template
      case "id":
        //value to be added
        propertyLabel = cigId;
        break;

      case "interactions":
        //value to be added
        propertyLabel = interactions;
        break;

      case "recommendations":
        //value to be added
        propertyLabel = recommendations;
        break;
      
      case "copd-group":
          //parameter label
          paramLabelData = "selected_copd_group";
          //get obj from Map
          resultObj = parameterMap.get(paramLabelData);
          //logger.info(JSON.stringify(resultObj));
          //get data from field dataList
          dataArr = resultObj[datalist];
          //value to be added
          //only item on list. last char on string (e.g., copd_group_B)
          val = dataArr[0].slice(-1);
          break;

      case "medications_user_preference":
            //parameter label
            paramLabelData = "medications_user_selection";
            //get obj from Map
            resultObj = parameterMap.get(paramLabelData);
            //get data from field dataList
            dataArr = resultObj[datalist];
    
            if (Array.isArray(dataArr)) {
              //for this case, we know that, by looking at DB form, dataArr[[all DSS suggested drugs],[selected drugs]]
              var selectedDrugs = dataArr[1];
              var allButSelectedDrugs = dataArr[0];
              logger.info(`selectedDrugs is ${JSON.stringify(selectedDrugs,3)}`);
              logger.info(`all but selected Drugs is ${JSON.stringify(allButSelectedDrugs,3)}`);
              logger.info(`entry_field is ${JSON.stringify(entry_field)}`);
              logger.info(`entry_templ is ${JSON.stringify(entry_templ)}`);
              if (
                Array.isArray(selectedDrugs) && Array.isArray(allButSelectedDrugs) &&
                entry_field &&
                entry_templ
              ) {
                //modify allDrugs array
                allButSelectedDrugs.forEach(function (elem, index) {
                  var temp = {};
                  temp[entry_field] = elem;
                  this[index] = temp;
                }, allButSelectedDrugs);
    
                //create preference list
                selectedDrugs.forEach(function (elem, index) {
                  var temp = {};
                  temp[entry_field] = elem;
    
                  var tempTemplate = JSON.parse(JSON.stringify(entry_templ));
    
                  if (
                    tempTemplate.hasOwnProperty("preferred") &&
                    tempTemplate.hasOwnProperty("alternative")
                  ) {
                    tempTemplate["preferred"] = temp;
                    tempTemplate["alternative"] = allButSelectedDrugs;
                    this[index] = tempTemplate;
                  } else {
                    logger.error(
                      "Property labels preferred or alternative are missing from object entry_template taken from template DB"
                    );
                    throw Error(
                      "Property labels preferred or alternative are missing from object entry_template taken from template DB"
                    );
                  }
                }, selectedDrugs);
    
                //value to be added
                val = selectedDrugs;
              } else
                throw Error(
                  `selectedDrugs is ${JSON.stringify(selectedDrugs,3)} and all but selected Drugs is ${JSON.stringify(allButSelectedDrugs,3)}
                  and entry_field is ${JSON.stringify(entry_field)} and entry_templ is ${JSON.stringify(entry_templ)}`
                );
            } else
              throw Error(
                "dataList result is not of type Array in form medications_user_preference"
              );
            break;

            
      default:
        break;
    }
    //add value to object
    traverseAndUpdateObjectWithPath(fieldList, propertyLabel, aggregatedForm);
  }
}

//apply cig-specific functions to outcome data
function setDataTemplateArgumentation(
  cigId, recommendations, interactions,
  pathActionList,
  aggregationForm,
  parameterMap
) {
  //loop over parameters
  for (const obj of pathActionList) {
    //template vars
    let paramLabelTemplate = obj[paramName];
    let fieldList = obj[fields];
    //label of field
    let entry_field = null;
    //object to be filled in with data
    let entry_templ = null;

    if (obj.hasOwnProperty(entryField) && obj.hasOwnProperty(entryTemplate)) {
      entry_templ = obj[entryTemplate];
      entry_field = obj[entryField];
    }
    
    //FHIR-based extracted data: vars
    let paramLabelData,
      resultObj,
      dataArr;
    //value to be added
    let val;

    switch (paramLabelTemplate) {
      //add cig id to template
      case "id":
        //value to be added
        val = cigId;
        break;

      case "interactions":
        //value to be added
        val = interactions;
        break;

      case "recommendations":
          //value to be added for recommendations case
          val = recommendations;
          break;

      case "copd-group":
        //parameter label
        paramLabelData = "selected_copd_group";
        //get obj from Map
        dataArr = getMapValue(paramLabelData, parameterMap, true);
        //value to be added
        //first item on list. last char on string (e.g., copd_group_B)
        val = dataArr[0].slice(-1);
        break;

      case "medications_user_preference":
        //parameter label in MongoDB document
        paramLabelData = "selectedTreatmentPathways"; //user selected
        let paramLabelData_altTreatments = "alternativeTreatmentPathways"; //alternative from same COPD group as suggested by CDS
        //get obj from Map
        let selectedDrugs =  getMapValue(paramLabelData, parameterMap, true);
        //it could not be part of the input if empty, then it returns undefined
        let allButSelectedDrugs =  getMapValue(paramLabelData_altTreatments, parameterMap, true) || [];

        if ( Array.isArray(selectedDrugs) && Array.isArray(allButSelectedDrugs) && entry_field &&
        entry_templ ) {
         // logger.info(`selectedDrugs is ${JSON.stringify(selectedDrugs,3)}`);
          //logger.info(`all but selected Drugs is ${JSON.stringify(allButSelectedDrugs,3)}`);
          //logger.info(`entry_field is ${JSON.stringify(entry_field)}`);
          //logger.info(`entry_templ is ${JSON.stringify(entry_templ)}`);
            //modify allDrugs array
            allButSelectedDrugs.forEach(function (elem, index) {
              var temp = {};
              temp[entry_field] = elem;
              this[index] = temp;
            }, allButSelectedDrugs);

            //create preference list
            selectedDrugs.forEach(function (elem, index) {
              var temp = {};
              temp[entry_field] = elem;

              var tempTemplate = JSON.parse(JSON.stringify(entry_templ));

              if (
                tempTemplate.hasOwnProperty("preferred") &&
                tempTemplate.hasOwnProperty("alternative")
              ) {
                tempTemplate["preferred"] = temp;
                tempTemplate["alternative"] = allButSelectedDrugs;
                this[index] = tempTemplate;
              } else {
                logger.error(
                  "Property labels preferred or alternative are missing from object entry_template taken from template DB"
                );
                throw Error(
                  "Property labels preferred or alternative are missing from object entry_template taken from template DB"
                );
              }
            }, selectedDrugs);

            //value to be added
            val = selectedDrugs;
          } else {
            throw Error(
              `selectedDrugs is ${JSON.stringify(selectedDrugs,3)} and all but selected Drugs is ${JSON.stringify(allButSelectedDrugs,3)}
              and entry_field is ${JSON.stringify(entry_field)} and entry_templ is ${JSON.stringify(entry_templ)}`
            );
        }
        break;
    }
   // logger.info(`setDataTemplateArgumentation: fieldList is ${JSON.stringify(fieldList)} with value ${JSON.stringify(val)} and object ${JSON.stringify(reqBodyTemplate)}`);
       //add value to object
    traverseAndUpdateObjectWithPath(fieldList, val, aggregationForm);
  }
}

/**
 *
 * @param {string} cigId CIG id
 * @param {object} mergedCig TMR-based, JSON-based CIG
 * @param {object} interactions TMR-based, JSON-based, mergedCig-based interaction object
 * @param {Map} paramaterMap Map containing parameters and associated values
 * @returns {Promise<object>} Form representing combined CIGs and identified interactions.
 */
exports.aggregateDataFromTmr = async (cigId, mergedCig, interactions, paramaterMap) => {
  ///create argumentation request
  let reqBodyTemplateMap = new Map();
  let templateActionsMap = new Map();
  let aggregatedForm, pathActions;
  let extensions = null;

  //retrieve ALL TEMPLATES for TMR
  for await (const doc of Templates.find().lean()) {
    //name of template
    let label = doc[labelTemplate];
    //add body template of label
    reqBodyTemplateMap.set(label, doc[bodyTemplate]);

    //add list of fields to be updated and corresponding paths
    templateActionsMap.set(label, doc[addTemplate]);
  }

  if ( (typeof ARGUMENTATION_HOST === "undefined" ||  ARGUMENTATION_HOST === null) )  {
    //label for json template
    aggregatedForm = reqBodyTemplateMap.get(cig_interactions_label);
    pathActions = templateActionsMap.get(cig_interactions_label);
     //update aggregateForm with tmr data
  setDataTemplate(
    cigId,
    mergedCig,
    interactions,
    pathActions,
    aggregatedForm
  );
  } else {
    //Workflow for aggregating tmr CIG and interactions//
    aggregatedForm = reqBodyTemplateMap.get(cig_conflict_label);
    pathActions = templateActionsMap.get(cig_conflict_label);

    logger.debug(`pathActions is ${JSON.stringify(pathActions)}`);
    
  //update aggregateForm with tmr data
  setDataTemplateArgumentation(
    cigId,
    mergedCig,
    interactions,
    pathActions,
    aggregatedForm,
    paramaterMap
  );

  try {
    extensions = await callMitigationService(aggregatedForm);
    //logger.info(`extensions is ${JSON.stringify(extensions)}`);
    } catch(err) {
      throw new ErrorHandler(500, JSON.stringify(err));
    }
  }

  if(!aggregatedForm.hasOwnProperty('TMR')) throw new ErrorHandler(500, 'aggregation form is missing property with label TMR');

  //return TMR object -without preferences as they have been already applied for tmitigation service-
  //and  extensions from result (they could be null if no mitigation service was found)
  return { aggregatedForm: aggregatedForm["TMR"], extensions: extensions };
};
