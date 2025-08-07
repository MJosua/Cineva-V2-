const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const task_steps_controller = require('../../controller/project_manager_controller/task_steps_controller');

// Task Steps CRUD operations
route.get('/task/:taskId/steps', decodeTokenHT, task_steps_controller.getTaskSteps);
route.post('/task/:taskId/steps', decodeTokenHT, task_steps_controller.createTaskStep);
// route.get('/steps/:stepId', decodeTokenHT, task_steps_controller.getTaskStepById);
route.put('/steps/:stepId', decodeTokenHT, task_steps_controller.updateTaskStep);
route.delete('/steps/:stepId', decodeTokenHT, task_steps_controller.deleteTaskStep);

// Task Step completion
route.patch('/steps/:stepId/complete', decodeTokenHT, task_steps_controller.completeTaskStep);
// route.patch('/steps/:stepId/uncomplete', decodeTokenHT, task_steps_controller.uncompleteTaskStep);

// Task Step journals
// route.get('/steps/:stepId/journals', decodeTokenHT, task_steps_controller.getStepJournals);
// route.post('/steps/:stepId/journals', decodeTokenHT, task_steps_controller.addStepJournal);
// route.put('/journals/:journalId', decodeTokenHT, task_steps_controller.updateStepJournal);
// route.delete('/journals/:journalId', decodeTokenHT, task_steps_controller.deleteStepJournal);

// Bulk operations
// route.patch('/task/:taskId/steps/reorder', decodeTokenHT, task_steps_controller.reorderTaskSteps);
// route.post('/task/:taskId/steps/bulk', decodeTokenHT, task_steps_controller.bulkCreateTaskSteps);

module.exports = route;