var express = require("express");
var router = express.Router();
const logger = require("../config/winston");
const asyncMiddleware = require("../lib/asyncMiddleware");
const { } =
  process.env;
const {
  getArguments,
  setResponse
} = require("../cds-services-controller/core_functions");
const {
  getServicesFromTmr
} = require("../cds-services-controller/hooks-controller_TMR");
const {
  getServices
} = require("../cds-services-controller/hooks-controller_nonCig");
const {
  getCdsCards,
  getCdsCardsFromTmr
} = require("../FHIR_converter_module/FHIR-converter-controller");

/* POST request services where no CIG tool is implicated */
router.post(
  "/:hook/cigModel/tmr",
  asyncMiddleware(getArguments),
  asyncMiddleware(getServicesFromTmr),
  asyncMiddleware(getCdsCardsFromTmr),
  asyncMiddleware(setResponse)
);

/* POST request services where no CIG tool is implicated 
router.post(
  "/:hook/cigModel/:cigId",
  asyncMiddleware(getArguments),
  asyncMiddleware(getCigServices),
  asyncMiddleware(getCdsCards),
  asyncMiddleware(setResponse)
);
*/

/* POST request services where no CIG tool is implicated */
router.post(
  "/:hook",
  asyncMiddleware(getArguments),
  asyncMiddleware(getServices),
  asyncMiddleware(getCdsCards),
  asyncMiddleware(setResponse)
);

module.exports = router;
