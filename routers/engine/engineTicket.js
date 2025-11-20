// routes/engine.js
const express = require('express');
const router = express.Router();
const engineTicket = require('../../controller/engine/engineTicket');
const { decodeTokenHT } = require('../../config/encrypts');

// protected endpoints
router.post('/create', decodeTokenHT, engineTicket.create);
router.post('/approve', decodeTokenHT, engineTicket.approve);
router.post('/reject', decodeTokenHT, engineTicket.reject);
router.get('/status/:ticket_id', decodeTokenHT, engineTicket.status);

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

module.exports = router;
