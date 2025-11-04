// routers/hots/hotsdashboard.js
const express = require("express");
const route = express.Router();

const { decodeTokenHT } = require('../../config/encrypts');
const hotsDashboardController = require("../../controller/hots_controller/hotsDashboardController");


// GET /hots/dashboard/functions
route.get("/functions", decodeTokenHT, hotsDashboardController.getDashboardFunctions);



module.exports = route




