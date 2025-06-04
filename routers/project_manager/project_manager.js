/**
 * @swagger
 * /order/get_id:
 *   post:
 *     summary: Get Order with specific ID
 *     description: Get Order with specific ID
 *     tags:
 *       - E-Order
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
 *                   example: https://short.ly/abc123
 */

const express = require('express')
const route = express.Router();
const { readToken } = require('../../config/encrypts');
const { projectmngr_project } = require('../../controller');

//GET
route.get('/get_id', readToken, projectmngr_project.geProjectAllByUser)



module.exports = route;