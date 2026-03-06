const express = require('express')
const route = express.Router();
const { readToken } = require('../../config/encrypts')
const { productController } = require('../../controller');
// const product = require('../controller/product');


route.get('/order', readToken, productController.getProductCatalog)
route.get('/trucking', readToken, productController.getProductCatalog)
route.get('/catalog', readToken, productController.getProductCatalog)
route.get('/omcode', readToken, productController.getOMCode)
// route.put('/edit', authController.editProduct)
// route.delete('/delete', authController.deleteProduct)

module.exports = route;