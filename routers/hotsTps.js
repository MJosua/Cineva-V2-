const express = require('express');
const route = express.Router();

const { decodeTokenHT } = require('../config/encrypts');
const { hotsTps } = require('../controller');

route.get('/region', decodeTokenHT, hotsTps.getRegion);
route.get('/country/:region_id', decodeTokenHT, hotsTps.getCountry);
route.get('/analyst', decodeTokenHT, hotsTps.getAnaliyst);














module.exports = route;