const authRouter = require('./auth')
const authTmRouter = require('./authTM')
const cartRouter = require('./cart')
const userRouter = require('./user')
const orderRouter = require('./order')
const eventRouter = require('./event')
const productRouter = require('./product')
const adminRouter = require('./admin')
const spectatorRouter = require('./spectator')
const trademarkRouter = require('./trademark')
const authRouterTest = require('./auth_test')
const productRouterTest = require('./product_test')
const cardGenerator = require('./cardGenerator')
const hotsAuth = require('./hotsAuth')
const hotsAdmin = require('./hotsAdmin')
const hotsTicket = require('./hotsTicket')
const hotsSettings = require('./hotsSettings')
const shortener = require('./shortener')
    
module.exports = {
    authRouter,
    authTmRouter,
    cartRouter,
    userRouter,
    orderRouter,
    productRouter,
    adminRouter,
    spectatorRouter,
    trademarkRouter,
    authRouterTest,
    productRouterTest,
    cardGenerator,
    hotsAuth,
    hotsAdmin,
    hotsTicket,
    hotsSettings,
    eventRouter,
    shortener
} 