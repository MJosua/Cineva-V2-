// routers/engine/engineProjectDashboard.js
const express = require('express');
const router = express.Router();
const projectDashboard = require('../../controller/engine/engineProjectDashboard');
const { decodeTokenHT } = require('../../config/encrypts');

// Project Dashboard endpoints (all protected)
router.get('/list/:service_id', decodeTokenHT, projectDashboard.listProjects);
router.get('/summary/:service_id', decodeTokenHT, projectDashboard.dashboardSummary);
router.get('/service-list', decodeTokenHT, projectDashboard.listProjectServices);
router.post('/create', decodeTokenHT, projectDashboard.createProject);
router.patch('/priority', decodeTokenHT, projectDashboard.updatePriority);

module.exports = router;
