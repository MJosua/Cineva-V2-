const express = require("express");
const router = express.Router();
const { decodeTokenHT } = require("../../config/encrypts");
const shipmentAnalyticsController = require("../../controller/hots_controller/ShipmentAnalyticsController");

router.get("/reliability", decodeTokenHT, shipmentAnalyticsController.getReliability);
router.get("/transit-times", decodeTokenHT, shipmentAnalyticsController.getTransitTimes);
router.get("/quota", decodeTokenHT, shipmentAnalyticsController.getQuota);
router.get("/risks", decodeTokenHT, shipmentAnalyticsController.getRisks);

module.exports = router;
