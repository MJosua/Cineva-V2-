const express = require("express");
const route = express.Router();
const { readToken } = require("../config/encrypts");

const { authControllerTest } = require("../controller");

//login
route.post("/iorudhtnhgi", authControllerTest.login_test);

//keeplogin
route.get("/esriounnhgf", readToken, authControllerTest.keepLogin_test);

module.exports = route;
 