// routers/hots/hotsdashboard.js
const express = require("express");
const route = express.Router();

const { decodeTokenHT } = require('../../config/encrypts');
const hotsDashboardController = require("../../controller/hots_controller/hotsDashboardController");


// GET /hots/dashboard/functions
route.get("/summary", decodeTokenHT, hotsDashboardController.getDashboardSummary);
route.get("/functions", decodeTokenHT, hotsDashboardController.getDashboardFunctions);
route.get("/report_srf", decodeTokenHT, hotsDashboardController.srf_report);
route.get("/report_service", decodeTokenHT, hotsDashboardController.report_service);
route.post("/report_detail/upsert", decodeTokenHT, hotsDashboardController.upsertReportDetail);

// Service Analytics Endpoints
route.get("/service_summary/:service_id", decodeTokenHT, hotsDashboardController.getServiceSummary);
route.get("/service_analytics/:service_id", decodeTokenHT, hotsDashboardController.getServiceAnalytics);
route.get("/service_tickets/:service_id", decodeTokenHT, hotsDashboardController.getServiceTickets);

// Panel System Endpoints
route.get("/panels/:dashboard_id", decodeTokenHT, hotsDashboardController.getDashboardPanels);
route.get("/card_summary/:function_id", decodeTokenHT, hotsDashboardController.getCardSummary);


module.exports = route




