const authController = require('./auth');
const authTmController = require('./authTM');
const cartController = require('./cart');
const userController = require('./user');
const orderController = require('./order');
const eventController = require('./event');
const productController = require('./product');
const adminController = require('./admin');
const spectatorController = require('./spectator');
const trademarkController = require('./trademark')
const authControllerTest = require('./auth_test')
const productControllerTest = require('./product_test')
const cardGenerator = require('./cardGenerator')
const hotsAuth = require('./hotsAuth')
const hotsAdmin = require('./hotsAdmin')
const hotsTicket = require('./hotsTicket')
const hotsSettingsController = require('./hotsSettingsController')
const shortenerController = require('./shortenerController')
const hotsTps = require('./hotsTps')


module.exports = {
    authController,
    authTmController,
    cartController,
    userController,
    orderController,
    eventController,
    productController,
    adminController,
    spectatorController,
    trademarkController,
    authControllerTest,
    productControllerTest,
    cardGenerator,
    hotsAuth,
    hotsAdmin,
    hotsTicket,
    hotsSettingsController,
    shortenerController,
    hotsTps

};