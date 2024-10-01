const express = require('express')
const route = express.Router();
const { decodeTokenHT } = require('../config/encrypts')

const { hotsTicket } = require('../controller');
const { hotsITSupport } = require('../config/uploader');

const uploadFileITSupport = hotsITSupport('it_support', 'it_support-').array('file', 10)
 

route.post('/it_support_ticket', decodeTokenHT, hotsTicket.addTicketITSupport)
route.post('/pc_request', decodeTokenHT, hotsTicket.addTicketPCRequest)
route.post('/upload_file', decodeTokenHT, uploadFileITSupport, hotsTicket.uploadFileITSupport)

route.get('/my_tiket', decodeTokenHT, hotsTicket.getMyTiket)
route.get('/laptop_specs', decodeTokenHT, hotsTicket.laptopSpeck)
route.get('/detail/:service_id/:ticket_id', decodeTokenHT, hotsTicket.getTicketDetail)

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