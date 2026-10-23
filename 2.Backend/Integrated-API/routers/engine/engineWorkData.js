// routers/engine/engineWorkData.js
const express = require('express');
const router = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const engineWorkData = require('../../controller/hots_controller/engine/engineWorkData');

// Get work data for an assignment
router.get('/assignment/:assignmentId/work-data', decodeTokenHT, engineWorkData.getAssignmentWorkData);

// Add work data to a ticket
router.post('/tickets/:ticketId/work-data', decodeTokenHT, engineWorkData.addWorkData);

// Update work data for a specific entity
router.patch('/tickets/:ticketId/work-data/:entityId', decodeTokenHT, engineWorkData.updateWorkData);

// Get specific work data field by ticket_id and field_name
router.get('/ticket/:ticketId/work-data/:fieldName', decodeTokenHT, engineWorkData.getWorkDataField);

// Save work data field for a ticket (upsert)
router.post('/ticket/:ticketId/work-data', decodeTokenHT, engineWorkData.saveWorkDataField);

module.exports = router;
