var express = require("express");
var router = express.Router();
const logger = require("../config/winston");
const asyncMiddleware = require("../lib/asyncMiddleware");
const {
  getArguments,
  setResponse,
  getArgumentsOld
} = require("../cds-services-controller/core_functions");
const {
  getTmrCigService
} = require("../cds-services-controller/hooks-controller_TMR");
const {
  getServices
} = require("../cds-services-controller/hooks-controller_nonCig");
const {
  getCopdAssessCdsCards,
  getTmrCdsCards
} = require("../FHIR_converter_module/FHIR-converter-controller");

/* POST request services where no CIG tool is implicated */
router.post(
  "/:hook/cigModel/tmr",
  asyncMiddleware(getArguments),
  asyncMiddleware(getTmrCigService),
  asyncMiddleware(getTmrCdsCards),
  asyncMiddleware(setResponse)
);

router.post(
  "/:hook/cigModel/demo",
  asyncMiddleware(getArguments),
  asyncMiddleware(getTmrCigService),
  asyncMiddleware(getTmrCdsCards),
  asyncMiddleware(setResponse)
);

/* POST request services where no CIG tool is implicated */
router.post(
  "/copd-careplan-select",
  asyncMiddleware(getArgumentsOld),
  asyncMiddleware(getTmrCigService),
  asyncMiddleware(getTmrCdsCards),
  asyncMiddleware(setResponse)
);


/* POST request services where no CIG tool is implicated */
router.post(
  "/copd-assess",
  asyncMiddleware(getArguments),
  asyncMiddleware(getServices),
  asyncMiddleware(getCopdAssessCdsCards),
  asyncMiddleware(setResponse)
);

module.exports = router;
