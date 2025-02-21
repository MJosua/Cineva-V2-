const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../config/encrypts')
const { eventController } = require('../controller');
const { eventDoorPrize } = require("../config/uploader");
const uploadFileDoorPrize = eventDoorPrize('event_Form', 'event_Form').array('file', 10);

//get data
route.post("/doorprize", uploadFileDoorPrize, eventController.setDoorprize);
route.get("/showticket", eventController.showticket);

//EventTw2024Specia
route.get("/eventtw2024datamentah", eventController.getColumn2EventTw2024);
route.get("/eventtw2024win", eventController.getWinColumn2EventTw2024);

//eventGetDataBasedOnID
route.get("/eventForm/:country_id/:event_id", eventController.showticketbyid);

route.post("/eventtw2024win",  uploadFileDoorPrize, eventController.setWinningEventTw2024);


module.exports = route;