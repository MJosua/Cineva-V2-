const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')
const { cartController } = require('../controller')

const { fileUploader } = require("../config/uploader")
const POuploader = fileUploader('cartPoFile', 'poFile-').array('file', 1)

//get
route.get('/get_id', readToken, cartController.getCart_id)
route.get('/get_header', readToken, cartController.getCartHeader)
route.get('/get_detail', readToken, cartController.getCartDetail)
route.get('/get_s_week', readToken, cartController.getPoWeek)

//add 
route.post('/add_header', readToken, POuploader, cartController.addCartHeader)
route.post('/add_detail', readToken, cartController.addCartDetail)
route.post('/add_cart', readToken, cartController.addCart)

//modify
route.delete('/delete/:cart_id', readToken, cartController.delete)
route.patch('/edit_header', readToken, cartController.editCartHeader)
route.patch('/edit_detail', readToken, cartController.editCartDetail)

module.exports = route;

