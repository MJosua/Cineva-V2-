// routers/hots/systemmenu.js
const express = require("express");
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const systemMenuController = require("../../controller/hots_controller/systemMenuController");

// GET /hots/system-menu
route.get("/", decodeTokenHT, systemMenuController.getSystemMenu);

// GET /hots/system-menu/admin
route.get("/admin", decodeTokenHT, systemMenuController.getSystemMenuAdmin);

// POST /hots/system-menu/bulk-update
route.post("/bulk-update", decodeTokenHT, systemMenuController.bulkUpdateOrder);

// POST /hots/system-menu/update
route.post("/update", decodeTokenHT, systemMenuController.updateSystemMenu);

// POST /hots/system-menu/add
route.post("/add", decodeTokenHT, systemMenuController.addSystemMenu);

module.exports = route;
