"use strict";
const {
  paramName,
  functLabel,
  argList,
  outcome,
  details,
  resultArgListIndex,
  resultList,
  typePath,
  actionList,
  action,
  pathListIndex,
  pathList,
  isMandatory,
  xpath,
  comparison,
  defaultVal,
  compare,
  findRef,
  functName,
  dataMap,
} = require("../database_modules/constants.js");
const { ErrorHandler } = require("../lib/errorHandler");
const logger = require("../config/winston");

module.exports = {

  /**
   * 
   * @param {string} key map key
   * @param {Map<string,object>} map hook data map
   * @param {boolean} isDataVal get value in field data, otherwise the whole value object
   * @returns 
   */
  getMapValue: function ( key, map, isDataVal = true) {

    //data parameter field
    const dataField = `data`;

    if (map.has(key)) {
      //get value 
      let val = map.get(key)
      //if isDataVal and there is a field data, return the array in the data field. Otherwise return value as it is
      return (isDataVal && val[dataField]) ? val[dataField] : val;
    }  else {
      throw new ErrorHandler( 500,
          `getMapValue function: key ${key} is missing in request data map ${JSON.stringify(Object.fromEntries(map))}`
      );
    }
  },

  /**
   * 
   * @param {object} req request object
   * @param {object} res response object
   * @param {object} next callback
   * extracts hook context and arguments, normalises the data and gathers them into an object in the request body
   */
  getArguments: async function (req, res, next) {
    //GET SPECIFIC HOOK CONTEXT//
    //hook id extracted from route
    let hookId = req.params.hook;
    logger.info("hookId is " + hookId);

    //CIG Model id extracted from route. If non-existent, use null
    let cigId = req.params.cigId || null;
    logger.info("CIG Model is " + cigId);

    //derived hook data values
    let dataMap = new Map(Object.entries(req.body));

    res.locals = { hook: hookId, cigTool:  cigId, entries:  dataMap};

    next();
  },
  
  setResponse: async function (req, res, next) {
    res.status(200).json(res.locals.cdsData);
  }

};