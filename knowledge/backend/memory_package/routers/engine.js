/**
 * routers/engine.js
 */
const express = require('express');
const router = express.Router();
const engineTicket = require('../controller/engine/engineTicket');

router.post('/ticket/create/:moduleKey', engineTicket.create);
router.get('/ticket/status/:ticket_id', engineTicket.status);
router.post('/ticket/approve', engineTicket.approve);
router.post('/ticket/reject', engineTicket.reject);
router.get('/tickets', engineTicket.list);
router.get('/tickets/my-requests', engineTicket.myRequests);
router.get('/tickets/dashboard-summary', engineTicket.dashboard);
router.post('/ticket/cancel', engineTicket.cancel);
router.post('/ticket/return', engineTicket.requestRevision);
router.post('/ticket/resubmit', engineTicket.resubmitDo);
router.get('/ticket/resubmit/:ticket_id', engineTicket.resubmitPrefill);
router.post('/ticket/resubmit/:ticket_id', engineTicket.resubmitDo);
router.get('/ticket/revisions/:ticket_id', engineTicket.revisionList);
router.get('/ticket/revision/:ticket_id/:rev', engineTicket.revisionGet);
router.get('/tickets/my-approvals', engineTicket.myApprovals);

module.exports = router;
