const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../config/encrypts')
const { eventController } = require('../controller')

//get data
route.post("/doorprize", eventController.setDoorprize);


module.exports = route;