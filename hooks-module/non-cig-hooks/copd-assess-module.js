"use strict";
const logger = require("../../config/winston");
const { getMapValue } = require("../../cds-services-controller/core_functions");

//fetch document parameters
const patientId = 'patientId', copdGroup = 'assessed-copd-group', 
          groupA = 'copdGroupA', groupB = 'copdGroupB', 
          groupC = 'copdGroupC', groupD = 'copdGroupD';

/**
 * 
 * @param {Map<string, object>} hookEntries CDS Hooks Manager Map of Hook-related entries
 * @returns patient id and personalised COPD groups data
 */
exports.assess_copd =  function (hookEntries) {


  //response object to contain data which will be pass to the next middleware
  let cdsData = {
    patient: null,
    groupA: null,
    groupB: null,
    groupC: null,
    groupD: null,
    assessedCopdGroup_code: null
  };

  
  cdsData.patient = getMapValue(patientId, hookEntries);
  cdsData.groupA = getMapValue(groupA, hookEntries);
  cdsData.groupB = getMapValue(groupB, hookEntries);
  cdsData.groupC = getMapValue(groupC, hookEntries);
  cdsData.groupD = getMapValue(groupD, hookEntries);
  cdsData.assessedCopdGroup_code = getMapValue(copdGroup, hookEntries);

  return cdsData;
};