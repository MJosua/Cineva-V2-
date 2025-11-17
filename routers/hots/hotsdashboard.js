// routers/hots/hotsdashboard.js
const express = require("express");
const route = express.Router();

const { decodeTokenHT } = require('../../config/encrypts');
const hotsDashboardController = require("../../controller/hots_controller/hotsDashboardController");


// GET /hots/dashboard/functions
route.get("/functions", decodeTokenHT, hotsDashboardController.getDashboardFunctions);
route.get("/report_srf", decodeTokenHT, hotsDashboardController.srf_report);
route.post("/report_detail/upsert", decodeTokenHT, hotsDashboardController.upsertReportDetail);


module.exports = route




