// routes/engine.js
const express = require('express');
const router = express.Router();
const engineTicket = require('../../controller/hots_controller/engine/engineTicket');
const engineAssignment = require('../../controller/hots_controller/engine/engineAssignment');
const engineTimeline = require('../../controller/hots_controller/engine/engineTimeline');
const uploadController = require('../../controller/hots_controller/engine/uploadController');
const { hotsTempUploader } = require('../../config/uploader');
const { decodeTokenHT } = require('../../config/encrypts');

const uploadTempMiddleware = hotsTempUploader('', 'temp').array('file', 10);

// public/temp upload endpoint
router.post('/upload-temp', decodeTokenHT, uploadTempMiddleware, uploadController.uploadTemp);

// protected endpoints
router.post('/create', decodeTokenHT, engineTicket.create);
router.post('/create/', decodeTokenHT, engineTicket.create);
router.post('/create/:moduleKey', decodeTokenHT, engineTicket.create);
router.post('/ticket/approve', decodeTokenHT, engineTicket.approve);
router.post('/ticket/reject', decodeTokenHT, engineTicket.reject);
router.get('/ticket/status/:ticket_id', decodeTokenHT, engineTicket.status);

// list / dashboards
router.get('/tickets', decodeTokenHT, engineTicket.list);
router.get('/tickets/my-approvals', decodeTokenHT, engineTicket.myApprovals);
router.get('/tickets/my-requests', decodeTokenHT, engineTicket.myRequests);
router.get('/tickets/dashboard-summary', decodeTokenHT, engineTicket.dashboard);

// cancel / return / resubmit
router.post('/ticket/cancel', decodeTokenHT, engineTicket.cancel);
router.post('/ticket/return', decodeTokenHT, engineTicket.requestRevision);
router.post('/ticket/resubmit', decodeTokenHT, engineTicket.resubmitDo);        // do resubmit (body)
router.get('/ticket/resubmit/:ticket_id', decodeTokenHT, engineTicket.resubmitPrefill); // prefill
// alternate: accept /ticket/resubmit/:ticket_id POST too (body)
router.post('/ticket/resubmit/:ticket_id', decodeTokenHT, engineTicket.resubmitDo);

// revision endpoints
router.get('/ticket/revisions/:ticket_id', decodeTokenHT, engineTicket.revisionList);
router.get('/ticket/revision/:ticket_id/:rev', decodeTokenHT, engineTicket.revisionGet);

// task completion endpoint
router.post('/task/complete', decodeTokenHT, engineTicket.completeTask);

// atomic timeline edit
router.post('/timeline/edit', decodeTokenHT, engineTimeline.editTimelineEntry);

// reload engine endpoint
router.get('/reload', decodeTokenHT, engineTicket.reload);

module.exports = router;

