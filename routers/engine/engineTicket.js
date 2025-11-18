/**
 * NEW HOTS ENGINE ROUTER
 * Does NOT touch old HOTS routes
 */

const express = require("express");
const router = express.Router();

const engineTicketController = require("../../controller/engine/engineTicket");

// CREATE TICKET
router.post("/ticket/create", engineTicketController.create);

// APPROVE TICKET
router.post("/ticket/approve", engineTicketController.approve);

// REJECT TICKET
router.post("/ticket/reject", engineTicketController.reject);

// GET STATUS
router.get("/ticket/status/:ticket_id", engineTicketController.status);

module.exports = router;
