const express = require('express');
const route = express.Router();

const { decodeTokenHT } = require('../../config/encrypts');
const { hotsTps } = require('../../controller');

const { hotsPS } = require('../../config/uploader')

//pricing structure uploader
const uploadFilePS = hotsPS('pricing_structure', 'files').array('file', 10);

route.get('/region/:country_id', decodeTokenHT, hotsTps.getRegion);
route.get('/country/:employee_id', decodeTokenHT, hotsTps.getCountry);
route.get('/analyst', decodeTokenHT, hotsTps.getAnaliyst);
route.get('/distributor/:country_id', decodeTokenHT, hotsTps.getDistributor);
route.get('/port/:company_id', decodeTokenHT, hotsTps.getPort);
route.get('/sku/:company_id', decodeTokenHT, hotsTps.getSKU);

route.post('/add', decodeTokenHT, uploadFilePS, hotsTps.addPs)














module.exports = route;