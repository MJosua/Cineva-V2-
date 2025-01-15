const express = require('express');
const route = express.Router();

const { decodeTokenHT } = require('../config/encrypts');
const { hotsTps } = require('../controller');

route.get('/region', decodeTokenHT, hotsTps.getRegion);
route.get('/country', decodeTokenHT, hotsTps.getCountry);














module.exports = route;