const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../config/encrypts')
const { eventController } = require('../controller');
const { eventDoorPrize } = require("../config/uploader");
const uploadFileDoorPrize = eventDoorPrize('event_taiwan_1', 'event_taiwan_1').array('file', 10);

//get data
route.post("/doorprize", uploadFileDoorPrize, eventController.setDoorprize)


module.exports = route;