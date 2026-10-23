
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const gantt_controller = require('../../controller/project_manager_controller/gantt_controller');

// Gantt chart routes
route.get('/project/:project_id', decodeTokenHT, gantt_controller.getGanttData);
route.put('/task/:task_id', decodeTokenHT, gantt_controller.updateTaskGantt);

module.exports = route;
