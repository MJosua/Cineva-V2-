// routers/hots/hotsReporting.js
// HOTS Reporting routes with HOTS authentication
const express = require("express");
const router = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const hotsReportingController = require('../../controller/hots_controller/hotsReportingController');

// E-Order Reporting endpoints (using HOTS auth)
router.get("/total_order/:uom", decodeTokenHT, hotsReportingController.totalOrderVolume);
router.get("/total_order_week/:uom", decodeTokenHT, hotsReportingController.totalOrderByWeek);
router.get("/top_country/:uom", decodeTokenHT, hotsReportingController.topCountry);
router.get("/top_dist/:uom", decodeTokenHT, hotsReportingController.topDistributor);

module.exports = router;
