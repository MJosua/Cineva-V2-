const express = require('express')
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts')

const { hotsTicket } = require('../../controller');
const { hotsPS, hotsITSupport, hotsITComment } = require('../../config/uploader');

const uploadFileITSupport = hotsITSupport('it_support', 'it_support').array('file', 10);
const uploadFilePricingStructure = hotsPS('pricing_structure', 'pricing_structure').array('file', 10);

const uploadFileITComment = hotsITComment('it_support', 'it_support').array('file', 10);


route.post('/it_support_ticket', decodeTokenHT, uploadFileITSupport, hotsTicket.addTicketITSupport)


const dynamicUploadMiddleware = (req, res, next) => {
    const service_id = parseInt(req.params.service_id, 10); // Ensure service_id is parsed as an integer

    if (service_id === 11) {
        // Use uploadFilePricingStructure for service_id === 11
        return uploadFilePricingStructure(req, res, next);
    } else {
        // Use uploadFileITSupport for all other service_id values
        return uploadFileITSupport(req, res, next);
    }
};






// File uploads
route.post('/upload/files/', decodeTokenHT, dynamicUploadMiddleware, hotsTicket.uploadFiles)

// Ticket creation
route.post('/create/ticket/:service_id', decodeTokenHT, dynamicUploadMiddleware, hotsTicket.createTicket)

// Ticket lists (GET methods with query parameter handling)
route.get('/my_ticket', decodeTokenHT, hotsTicket.getMyTickets)
route.get('/all_ticket', decodeTokenHT, hotsTicket.getAllTickets)
route.get('/task_list', decodeTokenHT, hotsTicket.getTaskList)
route.get('/task_count', decodeTokenHT, hotsTicket.getTaskCount)

// Ticket details
route.get('/detail/:ticket_id', decodeTokenHT, hotsTicket.getTicketDetail)

// Ticket actions (should be POST, not PUT for these operations)
route.post('/approve/:ticket_id', decodeTokenHT, hotsTicket.approveTicket)
route.post('/reject/:ticket_id', decodeTokenHT, hotsTicket.rejectTicket)

// Attachments
route.get('/attachment/:ticket_id', decodeTokenHT, hotsTicket.getTicketAttachments)


// cleanup route
route.post('/admin/cleanup/orphan-files', hotsTicket.cleanupOrphanFiles);


route.post('/setTicket/:service_id', decodeTokenHT, dynamicUploadMiddleware, hotsTicket.setTicket)


route.post('/pc_request', decodeTokenHT, hotsTicket.addTicketPCRequest)
route.post('/pc_request_detail', decodeTokenHT, hotsTicket.addTicketPCRequest)



// route.post('/upload_file', decodeTokenHT, uploadFileITSupport, hotsTicket.uploadFileITSupport)

route.get('/my_tiket', decodeTokenHT, hotsTicket.getMyTiket)
route.get('/all_tiket', decodeTokenHT, hotsTicket.getAllTiket)
route.get('/task_list_old', decodeTokenHT, hotsTicket.getTaskList_old)

route.get('/comment/:ticket_id', decodeTokenHT, hotsTicket.getTicketComment)
route.post('/comment/:ticket_id', decodeTokenHT, uploadFileITComment, hotsTicket.setTicketComment)


route.get('/fullfilled_tiket_count', decodeTokenHT, hotsTicket.getFullFilledTiketCount)
route.get('/open_tiket_count', decodeTokenHT, hotsTicket.getOpenTiketCount)
route.get('/rejected_tiket_count', decodeTokenHT, hotsTicket.getRejectTiketCount)


route.get('/detail/:service_id/:ticket_id', decodeTokenHT, hotsTicket.getTicketDetail_old)
route.post('/approve/:service_id/:ticket_id', decodeTokenHT, hotsTicket.setApprove)
route.post('/reject/:ticket_id', decodeTokenHT, hotsTicket.setReject)

route.post('/status_change/:ticket_id', decodeTokenHT, hotsTicket.setStatusChange)
route.post('/assingto_change/:ticket_id', decodeTokenHT, hotsTicket.setAssignToChange)
route.post('/ticket_change/:ticket_id', decodeTokenHT, hotsTicket.setTicketChange)


route.get('/email/:ticket_id', decodeTokenHT, hotsTicket.getTicketEmail)
route.post('/email/:ticket_id', decodeTokenHT, hotsTicket.setTicketEmail)
route.delete('/email/:ticket_id', decodeTokenHT, hotsTicket.delTicketEmail)

route.post('/testemail', hotsTicket.testEmail)

route.get('/laptop_specs', decodeTokenHT, hotsTicket.laptopSpeck)



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