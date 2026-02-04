const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')
const debug_controller = require('../controller/debug_controller');

// Debug UI Routes
route.get('/', debug_controller.getDebugUI);
route.get('/list', debug_controller.getFunctions);
route.post('/run/:funcName', debug_controller.runFunction);

//get product

route.post('/add_order', readToken, debug_controller.addOrderDebug)

module.exports = route;