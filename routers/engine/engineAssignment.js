const express = require('express');
const router = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const engineAssignment = require('../../controller/engine/engineAssignment');
const engineWorkData = require('../../controller/engine/engineWorkData');

// Get my assignments
router.get('/my-assignments', decodeTokenHT, engineAssignment.getMyAssignments);

// Get assignment count (for badge)
router.get('/my-assignments/count', decodeTokenHT, engineAssignment.getMyAssignmentCount);

// Get my job applications
router.get('/tickets/my-applications', decodeTokenHT, engineAssignment.myApplications);

// Get assignment detail
router.get('/assignment/:assignmentId', decodeTokenHT, engineAssignment.getAssignmentDetail);

// Get assignment work data
router.get('/assignment/:assignmentId/work-data', decodeTokenHT, engineWorkData.getAssignmentWorkData);

// Complete assignment
router.post('/assignment/:assignmentId/complete', decodeTokenHT, engineAssignment.completeAssignment);

// Timeline routes
router.get('/assignment/:assignmentId/timeline', decodeTokenHT, engineAssignment.getTimeline);
router.post('/assignment/:assignmentId/timeline', decodeTokenHT, engineAssignment.addTimelineUpdate);

// Create assignment (HR assigns job to applicant)
router.post('/tickets/:ticketId/assign', decodeTokenHT, engineAssignment.createAssignment);

// Apply for job
router.post('/tickets/:ticketId/apply', decodeTokenHT, engineAssignment.applyForJob);

// =========================================================================
// TASK MANAGEMENT ROUTES
// =========================================================================

// Get all tasks for an assignment
router.get('/assignment/:assignmentId/tasks', decodeTokenHT, engineAssignment.getTasks);

// Create a new task
router.post('/assignment/:assignmentId/tasks', decodeTokenHT, engineAssignment.createTask);

// Update a task (status, title, due_date, etc.)
router.patch('/assignment/:assignmentId/tasks/:taskId', decodeTokenHT, engineAssignment.updateTask);

// Delete a task and its steps
router.delete('/assignment/:assignmentId/tasks/:taskId', decodeTokenHT, engineAssignment.deleteTask);

// Create a task step
router.post('/assignment/:assignmentId/tasks/:taskId/steps', decodeTokenHT, engineAssignment.createTaskStep);

// Toggle/update a task step (checked, label)
router.patch('/assignment/:assignmentId/tasks/:taskId/steps/:stepId', decodeTokenHT, engineAssignment.toggleTaskStep);

module.exports = router;
