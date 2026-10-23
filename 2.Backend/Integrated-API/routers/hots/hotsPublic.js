const express = require("express");
const router = express.Router();
const hotsPublicController = require("../../controller/hots_controller/hotsPublicController");

// public department list for registration
router.get("/departments", hotsPublicController.getDepartmentsPublic);

module.exports = router;
