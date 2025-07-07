const express = require("express");
const router = express.Router();
const { readToken } = require('../../config/encrypts')
const { hotsAuth } = require('../../controller')
const { decodeTokenHT } = require('../../config/encrypts')

//auth dasar
router.post('/login', hotsAuth.login);
router.get('/keeplogin', decodeTokenHT, hotsAuth.keepLogin);
router.get('/profile/', decodeTokenHT, hotsAuth.getProfile);

//lupa password
router.post("/forgot",  hotsAuth.forgotPassword);
router.get("/verify-token", decodeTokenHT, hotsAuth.verifyTokenForgotPassword);
router.post("/change-forgot-password",  hotsAuth.changePasswordForgotPassword);
router.post("/change_pass_forgot", decodeTokenHT, hotsAuth.changePasswordForgotPassword); 



router.post('/pm/login', hotsAuth.pmlogin)
router.post('/pm/logout', decodeTokenHT, hotsAuth.pmlogout)
router.post('/pm/register', hotsAuth.pmregister)
router.get('/pm/profile', decodeTokenHT, hotsAuth.pmgetProfile)
router.put('/pm/profile', decodeTokenHT, hotsAuth.pmupdateProfile)
router.post('/pm/forgot-password', hotsAuth.pmforgotPassword)
router.post('/pm/reset-password', hotsAuth.pmresetPassword)



module.exports = router;

