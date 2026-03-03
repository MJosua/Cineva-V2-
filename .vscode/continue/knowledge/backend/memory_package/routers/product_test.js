const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')
const { productControllerTest } = require('../controller'); 

//get product
route.get('/rtbgrdg', readToken, productControllerTest.product_test) 

module.exports = route;