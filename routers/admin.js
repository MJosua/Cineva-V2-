const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')

const { adminController } = require('../controller');
// const product = require('../controller/product');
const { imageUploader } = require("../config/uploader")
const uploadBanner = imageUploader('banner', 'banner-').array('image', 1)

route.get('/config', readToken, adminController.getConfig)
route.get('/config-condition', readToken, adminController.getCondition)
route.get('/config-company', readToken, adminController.getCompany)
route.get('/config-top', readToken, adminController.getTOP)
route.get('/feedback', readToken, adminController.getFeedback)
route.get('/req-data-change', readToken, adminController.getRequestDataChange)
route.get('/banner', readToken, adminController.getBanner)
route.get('/account', readToken, adminController.getAccount)
route.get('/audit', readToken, adminController.getAudit)

route.post('/create_account', readToken, adminController.addAccount)
route.post('/banner', readToken, uploadBanner, adminController.addBanner)
route.post('/account-detail', readToken, adminController.getAccountDetail)
route.post('/config', readToken, uploadBanner, adminController.addConfig)

route.patch('/active', readToken, adminController.changeActive)
route.patch('/status-data-change', readToken, adminController.updateStatusRequestDataChange)

route.put('/config', readToken, adminController.editConfig)
route.put('/account', readToken, adminController.editAccount)
route.put('/banner', readToken, adminController.editBanner)
// route.put('/config_user', readToken, adminController.editConfigUser_id)
// route.put('/config_company', readToken, adminController.editConfigCompany_id)

route.delete('/banner', readToken, adminController.deleteBanner)
route.delete('/config/:id', readToken, adminController.deleteConfig)
// route.get('/', productController.getProduct)
// route.get('/', authController.selectProduct)
// route.put('/edit', authController.editProduct)
// route.delete('/delete', authController.deleteProduct)

route.get('/get_blocking_date_sys_text', readToken, adminController.sys_textCallBlockingDate)
route.post('/edit_blocking_date_sys_text', readToken, adminController.sys_textEditBlockingDate)
route.get('/next-user-id/:company_id', readToken, adminController.getNextUserID)

// Email preview (no auth for dev convenience)
route.get('/preview-email/:type/:so_id', adminController.previewEOrderEmail)


module.exports = route;