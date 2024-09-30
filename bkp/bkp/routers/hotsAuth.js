const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../config/encrypts')
const { hotsAuth } = require('../controller')

//auth dasar
route.post('/login', hotsAuth.login);
route.get('/keepLogin', decodeTokenHT, hotsAuth.keepLogin); 

//lupa password
route.post("/forgot",  hotsAuth.forgotPassword);
route.get("/verify-token", decodeTokenHT, hotsAuth.verifyTokenForgotPassword);
route.post("/change-forgot-password",  hotsAuth.changePasswordForgotPassword);
route.post("/change_pass_forgot", decodeTokenHT, hotsAuth.changePasswordForgotPassword); 



module.exports = route;