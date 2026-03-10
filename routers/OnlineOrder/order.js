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
const { readToken } = require('../../config/encrypts')


const { orderController } = require('../../controller');
// const { getOrderDetail } = require('../controller/order');
const { poUploader } = require("../../config/uploader")
const uploadPO = poUploader('poFile', 'poFile-').array('file', 1)
// const order = require('../controller/order');

//GET
route.get('/get_id', readToken, orderController.getOrder_id)

// route.get('/container', readToken, orderController.getContainer)
route.get('/stuffingweek', readToken, orderController.stuffingWeek)
route.get('/get_header', readToken, orderController.getOrderHeader)
route.get('/get_header_special/:order_id', readToken, orderController.getOrderHeaderWithID)
route.get('/get_header_noToken/:order_id', orderController.getOneOrderAllNoToken)
// route.get('/get_detail', readToken, orderController.getOrderDetail)
route.get('/get_detail_2', readToken, orderController.getOrderDetail2)
route.get('/get_po', readToken, orderController.getExistPo)
// route.get('/pi/:id', readToken, orderController.getPI)
// route.get('/tolling', readToken, orderController.getOrderDetailTolling)
route.get('/stuffing_date', readToken, orderController.getStuffingDateTrucking)
route.get('/get_all_in', readToken, orderController.getOrderAllIn)
route.get('/get_realization', readToken, orderController.getRealizationAllIn)
route.get('/get_order_detail/:order_id', readToken, orderController.getOneOrderDetail)
route.get('/get_order_real/:order_id', readToken, orderController.getOneOrderDetailRealization)


// route.get("/track_container", readToken, orderController.containerTracking);


// route.get('/order_container_detail/:order_id', readToken, orderController.getOrderContainerDetail)

// get order tolling {order_id} https://anp.indofoodinternational.com:2864/order/tolling/
// add order tolling { order_id, company_id, po_buyer, detail_id, sku, qty, remarks } https://anp.indofoodinternational.com:2864/order/add_detail_tolling/

//ADD
// route.post('/add_header', readToken, orderController.addOrderHeader)
// route.post('/add_detail', readToken, orderController.addOrderDetail)
// route.post('/add_detail_tolling', readToken, orderController.addOrderDetailTolling)
// route.post('/add_summary', readToken, orderController.addOrderSummary)
route.post('/upload-po', readToken, uploadPO, orderController.uploadFile)
route.post('/add_order', readToken, orderController.addOrder)
route.post('/send_email_order/:order_id/:employee_id/:user_id', orderController.mailerAPI)

//MODIFY
route.patch('/cancel', readToken, orderController.cancelOrder)

//DELETE
route.delete('/delete-po', readToken, orderController.deleteFile)
// route.delete('/delete', readToken, orderController.deleteOrder)


//Check and save searates custom query
// route.post('/check/:blno', readToken, orderController.checkOrderReal)
// route.post('/savesearate/:soid', readToken, orderController.saveSseaRates)

module.exports = route;