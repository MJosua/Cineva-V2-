const express = require("express");
const route = express.Router();
const { readToken } = require("../config/encrypts");

const { authController } = require("../controller");

route.post("/login", authController.login);
route.post("/forgot",  authController.forgotPassword);
route.post("/change-forgot-password",  authController.changePasswordForgotPassword);
route.get("/verify-token", readToken, authController.verifyTokenForgotPassword);
route.post("/change_pass_forgot", readToken, authController.changePasswordForgotPassword);
route.post("/crpt_pass", readToken, authController.hashPassword);
route.post("/change_pass", readToken, authController.changePassword);

route.get("/keep_login", readToken, authController.keepLogin);
route.get("/ping", authController.isOpenLoginPage);

module.exports = route;
 