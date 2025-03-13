const express = require("express");
const route = express.Router();
const { readToken } = require("../config/encrypts");
const { srtsController } = require('../controller');


route.get('/searatesTrack/:id/:type', readToken, srtsController.GetSeaRatesTrack)

module.exports = route;