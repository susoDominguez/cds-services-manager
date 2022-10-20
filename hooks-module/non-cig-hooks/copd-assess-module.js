"use strict";
const logger = require("../../config/winston");
const { getMapValue } = require("../../cds-services-controller/core_functions");
const {
  GOLD_GROUP_A,
GOLD_GROUP_B,
GOLD_GROUP_C,
GOLD_GROUP_D,
GOLD_ASSESSMENT,
PATIENT_ID,
ENCOUNTER_ID
} = process.env;
//fetch document parameters
const patientId = (PATIENT_ID || 'patientID'), copdGroup = (GOLD_ASSESSMENT || 'copdSeverityAssessment'), 
          groupA = (GOLD_GROUP_A || 'goldGroupA_treatmentPriorities'), groupB = (GOLD_GROUP_B || 'goldGroupB_treatmentPriorities'), 
          groupC = (GOLD_GROUP_C || 'goldGroupC_treatmentPriorities'), groupD = (GOLD_GROUP_D || 'goldGroupD_treatmentPriorities'),
          encounterId = (ENCOUNTER_ID || 'encounterID');

/**
 * 
 * @param {Map<string, object>} hookEntries CDS Hooks Manager Map of Hook-related entries
 * @returns patient id and personalised COPD groups data
 */
exports.assess_copd =  function (hookEntries) {


  //response object to contain data which will be pass to the next middleware
  let cdsData = {
    patientId: null,
    encounterId: null,
    groupA: null,
    groupB: null,
    groupC: null,
    groupD: null,
    assessedCopdGroup_code: null
  };

  
  cdsData.patientId = hookEntries.get(patientId);
  cdsData.encounterId = hookEntries.get(encounterId);
  cdsData.groupA = hookEntries.get(groupA);
  cdsData.groupB = hookEntries.get(groupB);
  cdsData.groupC = hookEntries.get(groupC);
  cdsData.groupD = hookEntries.get(groupD);
  cdsData.assessedCopdGroup_code = hookEntries.get(copdGroup);

  return cdsData;
};