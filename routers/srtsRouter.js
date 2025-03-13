const express = require("express");
const route = express.Router();
const { readToken } = require("../config/encrypts");
const { srtsController } = require('../controller');


route.get('/searatesTrack/:so_id/:number', readToken, srtsController.GetSeaRatesTrackUser)

module.exports = route;