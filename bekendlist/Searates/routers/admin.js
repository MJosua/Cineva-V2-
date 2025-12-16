const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')

const { adminController } = require('../controller');
// const product = require('../controller/product');
const { imageUploader } = require("../config/uploader")
const uploadBanner = imageUploader('banner', 'banner-').array('image', 1)

route.get('/config', readToken, adminController.getContainer)

module.exports = route;