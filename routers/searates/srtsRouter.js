const express = require("express");
const route = express.Router();
const { readToken } = require("../../config/encrypts");
const { srtsController } = require('../../controller');


route.get('/searatesTrack/:so_id/:number', readToken, srtsController.GetSeaRatesTrackUser)
route.get('/searatesTrackByNumber/:number',  srtsController.GetSeaRatesTrackNumber)
route.get('/searatesTrackByNumber/:number/:so_id',  srtsController.GetSeaRatesTrackNumberandsoid)
route.get('/checkdata/:number',  srtsController.SearatesCheck)
route.get('/getSealineList', srtsController.getSealineList)

module.exports = route;