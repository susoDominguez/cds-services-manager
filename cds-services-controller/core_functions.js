"use strict";
const {} = require("../database_modules/constants.js");
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
  getMapValue: function (key, map, isDataVal = true) {
    //data parameter field
    const dataField = `value`;

    if (map.has(key)) {
      //get value
      let val = map.get(key);
      //if isDataVal and there is a field value, return the value in the data field. Otherwise return value as it is
      return isDataVal && val.hasOwnProperty(dataField) ? val[dataField] : val;
    } else {
      throw new ErrorHandler(
        500,
        `getMapValue function: key ${key} is missing in request data map ${JSON.stringify(
          Object.fromEntries(map)
        )}`
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

    //derived hook data values
    let dataMap = new Map(req.body);

      let cigs = new Array();
      dataMap.forEach((value) => {
        //if it contains a list of CIGs, add to the array
        if (
          value.hasOwnProperty("activeCIG") &&
          Array.isArray(value["activeCIG"])
        ) {
          //if it is not already on array, add
          value["activeCIG"].map((elem) => {
            if (!cigs.includes(elem)) cigs.push(elem);
          });
        }
      });

    res.locals = { hook: hookId, entries: dataMap, cigsList: cigs};

    next();
  },

  /**
   *
   * @param {Object} req request
   * @param {Object} res response
   * @param {Object} next callback function
   */
  setResponse: async function (req, res, next) {
    res.status(200).json(res.locals.cdsData);
  },
};
