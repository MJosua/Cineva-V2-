const express = require("express");
const router = express.Router();
const controller = require("../../controller/hots_controller/urlShortenerController");
const { decodeTokenHT } = require("../../config/encrypts");

// Public route for resolving codes
router.get("/resolve/:code", controller.resolveShortUrl);

// Protected routes for management
router.post("/create", decodeTokenHT, controller.createShortUrl);
router.get("/list", decodeTokenHT, controller.getUserUrls);
router.delete("/:id", decodeTokenHT, controller.deleteShortUrl);

module.exports = router;
