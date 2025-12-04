
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const approval_controller = require('../../controller/project_manager_controller/approval_controller');

// Approval system routes
// route.get('/workflows', decodeTokenHT, approval_controller.getApprovalWorkflows);
// route.post('/submit', decodeTokenHT, approval_controller.submitForApproval);
route.get('/hierarchy/:user_id', decodeTokenHT, approval_controller.getApprovalHierarchy);
route.get('/pending', decodeTokenHT, approval_controller.getPendingApprovals);
// route.patch('/:approvalId/approve', decodeTokenHT, approval_controller.approveItem);
// route.patch('/:approvalId/reject', decodeTokenHT, approval_controller.rejectItem);

// Task approvals
// route.get('/tasks/:taskId/approvals', decodeTokenHT, approval_controller.getTaskApprovals);
// route.post('/tasks/:taskId/submit', decodeTokenHT, approval_controller.submitTaskForApproval);
route.post('/task/:task_id/submit', decodeTokenHT, approval_controller.submitTaskApproval);
route.put('/task/:approval_id/process', decodeTokenHT, approval_controller.processTaskApproval);

// Project approvals
// route.get('/projects/:projectId/approvals', decodeTokenHT, approval_controller.getProjectApprovals);
// route.post('/projects/:projectId/submit', decodeTokenHT, approval_controller.submitProjectForApproval);
route.post('/project/:project_id/submit', decodeTokenHT, approval_controller.submitProjectApproval);

module.exports = route;
