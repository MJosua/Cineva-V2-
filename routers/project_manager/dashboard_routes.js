
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const dashboard_controller = require('../../controller/project_manager_controller/dashboard_controller');

// Dashboard routes
// route.get('/', decodeTokenHT, dashboard_controller.getDashboardData);
route.get('/stats', decodeTokenHT, dashboard_controller.getDashboardStats);
route.get('/gantt', decodeTokenHT, dashboard_controller.getCrossProjectGantt);
// route.get('/analytics', decodeTokenHT, dashboard_controller.getAnalytics);
// route.get('/recent-activity', decodeTokenHT, dashboard_controller.getRecentActivity);

// Performance metrics
// route.get('/metrics/performance', decodeTokenHT, dashboard_controller.getPerformanceMetrics);
// route.get('/metrics/workload', decodeTokenHT, dashboard_controller.getWorkloadMetrics);
// route.get('/metrics/team', decodeTokenHT, dashboard_controller.getTeamMetrics);

module.exports = route;
