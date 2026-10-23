
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const kanban_controller = require('../../controller/project_manager_controller/kanban_controller');

// Kanban board routes
route.get('/project/:project_id', decodeTokenHT, kanban_controller.getKanbanData);
route.put('/task/:task_id/move', decodeTokenHT, kanban_controller.moveTaskKanban);

module.exports = route;
