// routers/engine/engineWorkData.js
const express = require('express');
const router = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const engineWorkData = require('../../controller/engine/engineWorkData');

// Get work data for an assignment
router.get('/assignment/:assignmentId/work-data', decodeTokenHT, engineWorkData.getAssignmentWorkData);

// Add work data to a ticket
router.post('/tickets/:ticketId/work-data', decodeTokenHT, engineWorkData.addWorkData);

// Update work data for a specific entity
router.patch('/tickets/:ticketId/work-data/:entityId', decodeTokenHT, engineWorkData.updateWorkData);

module.exports = router;
