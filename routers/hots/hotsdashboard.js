// routers/hots/hotsdashboard.js
const express = require("express");
const route = express.Router();

const { decodeTokenHT } = require('../../config/encrypts');
const hotsDashboardController = require("../../controller/hots_controller/hotsDashboardController");
const shipmentAnalyticsController = require("../../controller/hots_controller/ShipmentAnalyticsController");


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

// Shipment Analytics
route.get("/analytics/reliability", decodeTokenHT, shipmentAnalyticsController.getReliability);
route.get("/analytics/transit-times", decodeTokenHT, shipmentAnalyticsController.getTransitTimes);
route.get("/analytics/quota", decodeTokenHT, shipmentAnalyticsController.getQuota);
route.get("/analytics/risks", decodeTokenHT, shipmentAnalyticsController.getRisks);
route.get("/analytics/data-list", decodeTokenHT, shipmentAnalyticsController.getDataList);
route.get("/analytics/freight-report", shipmentAnalyticsController.getFreightReport);
route.get("/analytics/factories", shipmentAnalyticsController.getFactories);
route.get("/analytics/usage-details", shipmentAnalyticsController.getUsageDetails);
route.get("/analytics/notes", decodeTokenHT, shipmentAnalyticsController.getReportNotes);
route.post("/analytics/notes", decodeTokenHT, shipmentAnalyticsController.saveReportNote);


module.exports = route
