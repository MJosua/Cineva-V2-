const express = require('express');
const router = express.Router();
const engineTicket = require('../../controller/engine/engineTicket');
const { decodeTokenHT } = require('../../config/encrypts');

router.post('/create', engineTicket.create);
router.post('/approve', engineTicket.approve);
router.post('/reject', engineTicket.reject);
router.get('/status/:ticket_id', decodeTokenHT, engineTicket.status);

// NEW
router.get("/tickets", decodeTokenHT,engineTicket.list);
router.get("/tickets/my-approvals", engineTicket.myApprovals);
router.get("/tickets/my-requests", engineTicket.myRequests);
router.get("/tickets/dashboard-summary", engineTicket.dashboard);

module.exports = router;
