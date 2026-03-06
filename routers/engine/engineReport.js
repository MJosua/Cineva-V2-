/**
 * routers/engine/engineReport.js
 * 
 * Exposes reporting endpoints safely.
 */

const express = require('express');
const router = express.Router();
const engineReport = require('../../controller/hots_controller/engine/engineReport');
const { decodeTokenHT } = require('../../config/encrypts');

// Main Generic Reporting Endpoint
// GET /engine/report/:service_id?status_id=2&start_date=2023-01-01
router.get('/report/:service_id', decodeTokenHT, engineReport.getReport);

// POST /engine/report/update (Cell Edit)
router.post('/report/update', decodeTokenHT, engineReport.updateReport);

// POST /engine/report/suggest (Smart Report generator)
router.post('/report/suggest', decodeTokenHT, engineReport.suggestReport);

// GET /engine/report/card-reports/:assignmentId (all card report entries for Activity tab)
router.get('/report/card-reports/:assignmentId', decodeTokenHT, engineReport.getCardReports);

module.exports = router;
