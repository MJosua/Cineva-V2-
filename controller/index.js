const authController = require('./auth');
const authTmController = require('./authTM');
const cartController = require('./cart');
const userController = require('./user');
const orderController = require('./order');
const productController = require('./product');
const adminController = require('./admin');
const spectatorController = require('./spectator');
const trademarkController = require('./trademark')
const authControllerTest = require('./auth_test')
const productControllerTest = require('./product_test')
const cardGenerator = require('./cardGenerator')
const hotsAuth = require('./hotsAuth')

module.exports = {
    authController,
    authTmController,
    cartController,
    userController,
    orderController,
    productController,
    adminController,
    spectatorController,
    trademarkController,
    authControllerTest,
    productControllerTest,
    cardGenerator,
    hotsAuth
};