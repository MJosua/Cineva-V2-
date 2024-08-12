const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')
const { productController } = require('../controller');
// const product = require('../controller/product');


route.get('/order', readToken, productController.getProductOrder)
route.get('/trucking', readToken, productController.getProductTrucking)
route.get('/catalog', readToken, productController.getProductCatalog)
// route.put('/edit', authController.editProduct)
// route.delete('/delete', authController.deleteProduct)

module.exports = route;