
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const approval_controller = require('../../controller/project_manager_controller/approval_controller');

// Approval system routes
route.get('/hierarchy/:user_id', decodeTokenHT, approval_controller.getApprovalHierarchy);
route.get('/pending', decodeTokenHT, approval_controller.getPendingApprovals);

// Task approvals
route.post('/task/:task_id/submit', decodeTokenHT, approval_controller.submitTaskApproval);
route.put('/task/:approval_id/process', decodeTokenHT, approval_controller.processTaskApproval);

// Project approvals
route.post('/project/:project_id/submit', decodeTokenHT, approval_controller.submitProjectApproval);

module.exports = route;
