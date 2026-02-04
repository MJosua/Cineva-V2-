



const express = require("express");
const route = express.Router();

const { shortenerController } = require("../../controller");

route.post('/shorten', shortenerController.setShorten)
/**
 * @swagger
 * /shortener/shorten:
 *   post:
 *     summary: Shorten the URL
 *     description: Shorten the URL and return the shortened link
 *     tags:
 *       - Shortener
 *     parameters:
 *       - in: query
 *         name: API_Shortener
 *         required: true
 *         schema:
 *           type: string
 *         description: The input field for the query
 *     responses:
 *       200:
 *         description: Result is the shortened URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortenedUrl:
 *                   type: string
 *                   description: The shortened version of the URL
 * 
 */

route.post('/shortenCustom', shortenerController.setShortenCustom)
/**
 * @swagger
 * /shortener/shortenCustom:
 *   post:
 *     summary: Shorten the URL with custom response
 *     description: Shorten the URL and return the shortened link with custom response
 *     tags:
 *       - Shortener
 *     parameters:
 *       - in: query
 *         name: API_Shortener
 *         required: true
 *         schema:
 *           type: string
 *         description: The input field for the query
 *     responses:
 *       200:
 *         description: Result is the shortened URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortenedUrl:
 *                   type: string
 *                   description: The shortened version of the URL
 * 
 */


route.get('/:id', shortenerController.getShorten)
/**
 * @swagger
 * /shortener/:id:
 *   get:
 *     summary: Get Shorten  URL
 *     description: Shorten URL and return the shortened link
 *     tags:
 *       - Shortener
 *     parameters:
 *       - in: query
 *         name: API_Shortener
 *         required: true
 *         schema:
 *           type: string
 *         description: The input field for the query
 *     responses:
 *       200:
 *         description: Result is the shortened URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortenedUrl:
 *                   type: string
 *                   description: The shortened version of the URL
 * 
 */

module.exports = route;