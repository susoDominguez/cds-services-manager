"use strict";
const { ErrorHandler } = require("../lib/errorHandler");
const logger = require("../config/winston");
const axios = require("axios");
const qs = require("querystring");
const { TMR_COLLECTION } = require("../database_modules/dbConnection_Mongoose");
const {
  paramName,
  labelTemplate,
  bodyTemplate,
  addTemplate,
  fields,
  aPath,
  entryField,
  entryTemplate
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
const cig_interactions_label = 'json-template', cig_conflict_label = 'argumentation-template';

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
          aField[lstPropLabel] ? (aField[lstPropLabel] += val) : (aField[lstPropLabel] = val);
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
  /*
  logger.info(
    `traverseAndUpdateObjectWithPath method has pathLIst ${JSON.stringify(pathList)} and value ${JSON.stringify(
      val
    )} with resulting object ${JSON.stringify(queryObj)}`
  );*/
}

//apply cig-specific functions to outcome data
function setDataTemplateArgumentation(cigId,recommendations,interactions,pathActionsList,aggregatedForm) {
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

      default:
        break;
    }
       //add value to object
    traverseAndUpdateObjectWithPath(fieldList, propertyLabel, aggregatedForm);
  }
}

/**
 * 
 * @param {string} cigId CIG id
 * @param {object} mergedCig TMR-based, JSON-based CIG
 * @param {object} interactions TMR-based, JSON-based, mergedCig-based interaction object
 * @param {string} hookId CDS Hook id
 * @returns {Promise<object>} Form representing combined CIGs and identified interactions.
 */
exports.aggregateDataFromTmr =  async (cigId,mergedCig,interactions,hookId=undefined) => {

    //TODO: when adding conflict resolution engine, depending on hookId use one template or another (w vs w/out conflict)

       ///create argumentation request
       let reqBodyTemplateMap = new Map();
       let templateActionsMap = new Map();
   
       //retrieve ALL TEMPLATES for TMR
       for await (const doc of TMR_COLLECTION.find().lean()) {
         //name of template
         let label = doc[labelTemplate]; 
   
         //add body template of label
         reqBodyTemplateMap.set(label, doc[bodyTemplate]);
   
         //add list of fields to be updated and corresponding paths
         templateActionsMap.set(label, doc[addTemplate]);
       }
   
       //Workflow for aggregating tmr CIG and interactions//
   
       //label for json template
       let aggregatedForm = reqBodyTemplateMap.get(cig_interactions_label);
       let pathActions = templateActionsMap.get(cig_interactions_label);
       //logger.info(`aggregatedForm before aggregation is ${JSON.stringify(aggregatedForm)}`)
       //logger.info(`pathActions before aggregation is ${JSON.stringify(pathActions)}`)
       //update aggregateForm with tmr data
       setDataTemplateArgumentation(cigId,mergedCig,interactions,pathActions,aggregatedForm);
   
         //return TMR object from result
       return aggregatedForm['TMR'];
};
