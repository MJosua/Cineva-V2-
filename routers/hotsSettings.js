const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../config/encrypts')
const { hotsSettingsController } = require('../controller');


route.get('/get_menu', decodeTokenHT, hotsSettingsController.getmenu)
route.get('/get_menu_active', decodeTokenHT, hotsSettingsController.getserviceactive)
route.get('/get_menu_inactive', decodeTokenHT, hotsSettingsController.getserviceinactive)
route.post('/toggle_menu', decodeTokenHT, hotsSettingsController.setserviceactivestatus)

route.get('/get_superior', decodeTokenHT, hotsSettingsController.getsuperior)


route.get('/get_team_member/:team_id', decodeTokenHT, hotsSettingsController.getmember)
route.get('/get_service', decodeTokenHT, hotsSettingsController.getservice)
route.get('/get_serviceCategory', decodeTokenHT, hotsSettingsController.getserviceCategory)
route.get('/get_category', decodeTokenHT, hotsSettingsController.getcategory)
route.get('/get_completionstatus', decodeTokenHT, hotsSettingsController.getcompletionstatus)

// SRF
route.get('/get_srf_plant', decodeTokenHT, hotsSettingsController.getSRFPlant)
route.get('/get_srf_sampleCategory', decodeTokenHT, hotsSettingsController.getSRFSampleCategory)
route.get('/get_srf_deliverTo', decodeTokenHT, hotsSettingsController.getSRFDeliverTo)

//Data Update
route.get('/get_data_update_service', decodeTokenHT, hotsSettingsController.getservice_dataupdate)

// Pricing Structure Settings
route.get('/get_ps_ticket_row', decodeTokenHT, hotsSettingsController.getpricingstructure_row)



module.exports = route

/*

POST /hots_ticket/pc_request => auth bearer token, req.body.{ job_desc, reason, laptop_spec_id, old_device, date_acquisition, old_device_spec }
POST /hots_ticket/it_support_ticket => auth bearer token, req.body.{ assigned_to, type, issue_desc, attachment } //attachment berisi array yg didalamnya ada object [{url:http://blablabla},{url:http://blablabla},]
POST /hots_ticket/upload_file => untuk upload file

GET /hots_ticket/laptop_specs 
GET /hots_ticket/my_tiket 
GET /hots_ticket/detail/${service_id}/${ticket_id} 

semua wajib bawa token


*/