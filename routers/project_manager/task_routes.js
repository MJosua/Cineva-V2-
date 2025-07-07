const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const task_controller = require('../../controller/project_manager_controller/task_controller');

// Task CRUD operations
route.get('/', decodeTokenHT, task_controller.getAllTasks);
route.get('/my-tasks', decodeTokenHT, task_controller.getMyTasks);
route.post('/', decodeTokenHT, task_controller.createTask);
route.patch('/:id/status', decodeTokenHT, task_controller.updateTaskStatus);
route.patch('/:id/move-group', decodeTokenHT, task_controller.moveTaskToGroup);

// Task dependencies
//  route.get('/:id/dependencies', decodeTokenHT, task_controller.getTaskDependencies);
//  route.post('/:id/dependencies', decodeTokenHT, task_controller.addTaskDependency);

// Time tracking
// route.get('/:id/time-entries', decodeTokenHT, task_controller.getTimeEntries);
// route.post('/:id/time-entries', decodeTokenHT, task_controller.logTime);

module.exports = route;
