const express = require("express");
const route = express.Router();

const { shortenerController } = require("../controller");

route.post('/shorten', shortenerController.setShorten)
route.post('/shortenCustom', shortenerController.setShortenCustom)
route.get('/:id', shortenerController.getShorten)


module.exports = route;