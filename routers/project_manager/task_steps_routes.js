
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const task_steps_controller = require('../../controller/project_manager_controller/task_steps_controller');

// Task Step CRUD operations
route.get('/task/:taskId/steps', decodeTokenHT, task_steps_controller.getTaskSteps);
route.post('/task/:taskId/steps', decodeTokenHT, task_steps_controller.createTaskStep);
route.put('/steps/:stepId', decodeTokenHT, task_steps_controller.updateTaskStep);
route.patch('/steps/:stepId/order', decodeTokenHT, task_steps_controller.updateTaskStepOrder);
route.patch('/steps/:stepId/complete', decodeTokenHT, task_steps_controller.completeTaskStep);
route.patch('/steps/:stepId/approval', decodeTokenHT, task_steps_controller.processTaskStepApproval);
route.delete('/steps/:stepId', decodeTokenHT, task_steps_controller.deleteTaskStep);

// Task Step Templates
route.get('/templates/task-steps', decodeTokenHT, task_steps_controller.getTaskStepTemplates);
route.post('/templates/task-steps', decodeTokenHT, task_steps_controller.createTaskStepTemplate);

module.exports = route;
