
const express = require('express');
const route = express.Router();
const { readTokenTM } = require('../config/encrypts');

const { trademarkController } = require('../controller');

//CREATE
//READ
//UPDATE
//DELETE

route.get('/getdata', readTokenTM, trademarkController.getTmcard)
route.post('/postdata', readTokenTM, trademarkController.postTmcard)
route.delete('/deletedata', readTokenTM, trademarkController.deleteTmcard)
route.post('/updatedata', readTokenTM, trademarkController.updateTmcard)

route.get('/getregion', readTokenTM, trademarkController.getRegionTmcard)
route.get('/getcountry', readTokenTM, trademarkController.getCountryTmcard)
route.get('/getcountryAll', readTokenTM, trademarkController.getCountryAllTmcard)
route.get('/getbrand', readTokenTM, trademarkController.getBrandTmcard)
route.get('/getstatus', readTokenTM, trademarkController.getStatusTmcard)
route.get('/getregno', readTokenTM, trademarkController.getRegnoTMcard)

route.get('/getunder6', readTokenTM, trademarkController.getunder6monthTmcard)
route.get('/getunder1', readTokenTM, trademarkController.getunder1monthTmcard)
route.get('/getunder0', readTokenTM, trademarkController.getunder0monthTmcard)
route.get('/getunder', readTokenTM, trademarkController.getunderprocess)




module.exports = route;