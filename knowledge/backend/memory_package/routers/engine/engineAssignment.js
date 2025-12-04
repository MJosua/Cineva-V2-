// routers/engine/engineAssignment.js
const express = require('express');
const router = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const engineAssignment = require('../../controller/engine/engineAssignment');

// Get my assignments
router.get('/my-assignments', decodeTokenHT, engineAssignment.getMyAssignments);

// Get assignment count (for badge)
router.get('/my-assignments/count', decodeTokenHT, engineAssignment.getMyAssignmentCount);

// Get assignment detail
router.get('/assignment/:assignmentId', decodeTokenHT, engineAssignment.getAssignmentDetail);

// Complete assignment
router.post('/assignment/:assignmentId/complete', decodeTokenHT, engineAssignment.completeAssignment);

module.exports = router;
