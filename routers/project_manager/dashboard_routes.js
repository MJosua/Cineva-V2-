
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const dashboard_controller = require('../../controller/project_manager_controller/dashboard_controller');

// Dashboard routes
route.get('/stats', decodeTokenHT, dashboard_controller.getDashboardStats);
route.get('/gantt', decodeTokenHT, dashboard_controller.getCrossProjectGantt);

module.exports = route;
