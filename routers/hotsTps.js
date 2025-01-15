const express = require('express');
const route = express.Router();

const { decodeTokenHT } = require('../config/encrypts');
const { hotsTps } = require('../controller');

route.get('/tps_region', decodeTokenHT, hotsTps.getRegion);
route.get('/tps_country', decodeTokenHT, hotsTps.getCountry);














module.exports = route;