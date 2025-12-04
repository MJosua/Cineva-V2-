const express = require("express");
const route = express.Router();
const { readToken } = require("../config/encrypts");

const { spectatorController } = require("../controller");

route.get('/coordinate/:id', spectatorController.getCoordinate)
route.get('/total_order/:uom', readToken, spectatorController.totalOrderVolume)
route.get('/top_dist/:uom', readToken, spectatorController.topDistributor)
route.get('/total_order_week/:uom', readToken, spectatorController.totalOrderByWeek)

route.get('/line-graph/:uom', readToken, spectatorController.incomingOrderVolume)
route.get('/top-country/:uom', readToken, spectatorController.topCountry)
route.get('/top-flavour/:uom', readToken, spectatorController.topFlavour)
route.get('/all_order', readToken, spectatorController.allOrder)
route.get('/detail/:order_id', readToken, spectatorController.orderDetail)
route.get('/summary/:order_id', readToken, spectatorController.orderSummary)

module.exports = route;