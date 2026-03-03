const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const time_tracking_controller = require('../../controller/project_manager_controller/time_tracking_controller');

// Time Entry CRUD operations
route.get('/task/:taskId/entries', decodeTokenHT, time_tracking_controller.getTaskTimeEntries);
route.post('/task/:taskId/entries', decodeTokenHT, time_tracking_controller.logTimeEntry);
route.get('/entries/:entryId', decodeTokenHT, time_tracking_controller.getTimeEntryById);
route.put('/entries/:entryId', decodeTokenHT, time_tracking_controller.updateTimeEntry);
route.delete('/entries/:entryId', decodeTokenHT, time_tracking_controller.deleteTimeEntry);

// User time tracking
route.get('/user/:userId/entries', decodeTokenHT, time_tracking_controller.getUserTimeEntries);
route.get('/user/:userId/summary', decodeTokenHT, time_tracking_controller.getUserTimeSummary);

// Project time tracking
route.get('/project/:projectId/entries', decodeTokenHT, time_tracking_controller.getProjectTimeEntries);
route.get('/project/:projectId/summary', decodeTokenHT, time_tracking_controller.getProjectTimeSummary);

// Time tracking reports
route.get('/reports/daily', decodeTokenHT, time_tracking_controller.getDailyTimeReport);
route.get('/reports/weekly', decodeTokenHT, time_tracking_controller.getWeeklyTimeReport);
route.get('/reports/monthly', decodeTokenHT, time_tracking_controller.getMonthlyTimeReport);

// Active time tracking (start/stop timer)
route.post('/timer/start', decodeTokenHT, time_tracking_controller.startTimer);
route.post('/timer/stop', decodeTokenHT, time_tracking_controller.stopTimer);
route.get('/timer/current', decodeTokenHT, time_tracking_controller.getCurrentTimer);

module.exports = route;