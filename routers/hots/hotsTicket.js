const express = require('express')
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts')


const { hotsTicket } = require('../../controller');
const engineTicket = require('../../controller/hots_controller/engine/engineTicket'); // Import Engine Ticket
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






// File uploads (Keep legacy for now until file handling is fully migrated)
route.post('/upload/files/', decodeTokenHT, dynamicUploadMiddleware, hotsTicket.uploadFiles)
route.post('/download/zip/', decodeTokenHT, hotsTicket.downloadzip)

// Ticket creation (Start using Engine)
// route.post('/create/ticket/:service_id', decodeTokenHT, dynamicUploadMiddleware, hotsTicket.createTicket)
route.post('/create/ticket/:service_id', decodeTokenHT, dynamicUploadMiddleware, async (req, res) => {
    // Adapter for engine create
    const service_id = parseInt(req.params.service_id, 10);
    req.body.service_id = service_id;
    req.body.creator_id = req.dataToken.user_id;
    req.body.creator_email = req.dataToken.email;

    // [Specific Logic for Meeting Room (13)]
    // 1. If it's a HOTS request, enforce the logged-in user as the PIC
    if (service_id === 13 && req.body.request_source === "HOTS") {
        if (!req.body.form_data) req.body.form_data = {};

        // Auto-fill PIC info from session (Using UID as requested)
        req.body.form_data.PIC = {
            type: "field",
            label: "PIC",
            value: req.dataToken.uid || req.dataToken.user_name || req.dataToken.firstname,
            field_id: "PIC_field"
        };
        req.body.form_data.PIC_user_id = {
            type: "field",
            label: "PIC User ID",
            value: String(req.dataToken.user_id),
            field_id: "PIC_user_id_field"
        };

        // Also ensure requested_by is set correctly
        req.body.form_data.requested_by = {
            type: "field",
            label: "Requested By",
            value: req.dataToken.firstname || req.dataToken.user_name,
            field_id: "requested_by_field"
        };

        // Override creator_id to ensure it shows up in "My Tickets"
        req.body.creator_id = req.dataToken.user_id;
    }
    // 2. Original Logic: If PIC_user_id is provided (e.g. Kiosk/Tablet booking), 
    // we impersonate the creator so the ticket appears in the PIC's "My Tickets" list.
    else if (service_id === 13 && req.body.form_data && req.body.form_data.PIC_user_id && req.body.form_data.PIC_user_id.value) {
        req.body.creator_id = req.body.form_data.PIC_user_id.value;
    }

    return engineTicket.create(req, res);
});

// Ticket lists (Mapped to Engine)
route.get('/my_ticket', decodeTokenHT, (req, res) => {
    req.query.mine = 'true';
    return engineTicket.list(req, res);
});
route.get('/all_ticket', decodeTokenHT, engineTicket.list);
route.get('/task_list', decodeTokenHT, engineTicket.myApprovals);
route.get('/task_list_involved', decodeTokenHT, engineTicket.involvedApprovals);
route.get('/task_count', decodeTokenHT, engineTicket.dashboard); // Dashboard returns summary including my_approvals

// Ticket details (Mapped to Engine)
route.get('/detail/:ticket_id', decodeTokenHT, engineTicket.detail);
route.put('/detail/:ticket_id', decodeTokenHT, engineTicket.updateDetail);

// Meeting Room specific action endpoint (supports Web with token, or Kiosk without token but with password)
const optionalDecodeTokenHT = (req, res, next) => {
    if (req.body && req.body.kiosk_password) {
        // Bypass token requirement since we validate via PIC password in controller
        return next();
    }
    return decodeTokenHT(req, res, next);
};
route.post('/meetingroom/action', optionalDecodeTokenHT, engineTicket.meetingRoomAction);

// Ticket actions (Mapped to Engine with Adapters)
route.post('/approve/:ticket_id', decodeTokenHT, (req, res) => {
    req.body.ticket_id = req.params.ticket_id;
    req.body.approver_id = req.dataToken.user_id; // Infer approver from token
    req.body.note = req.body.comment; // Map comment to note
    return engineTicket.approve(req, res);
});

route.post('/reject/:ticket_id', decodeTokenHT, (req, res) => {
    req.body.ticket_id = req.params.ticket_id;
    req.body.approver_id = req.dataToken.user_id;
    req.body.note = req.body.rejection_remark; // Map rejection_remark to note
    return engineTicket.reject(req, res);
});

route.put('/close/:ticket_id', decodeTokenHT, hotsTicket.closeTicket) // Keep legacy for close if engine doesn't support generic close yet
route.put('/closeservice/:ticket_id', decodeTokenHT, hotsTicket.closeTicketservice)

// Attachments
route.get('/attachment/:ticket_id', decodeTokenHT, hotsTicket.getTicketAttachments)


// cleanup route
route.post('/admin/cleanup/orphan-files', hotsTicket.cleanupOrphanFiles);


route.post('/setTicket/:service_id', decodeTokenHT, dynamicUploadMiddleware, async (req, res) => {
    // Adapter for legacy setTicket to Engine
    const service_id = parseInt(req.params.service_id, 10);
    req.body.service_id = service_id;
    req.body.creator_id = req.dataToken.user_id;
    req.body.creator_email = req.dataToken.email;

    // Map legacy top-level body to form_data if form_data is missing
    if (!req.body.form_data) {
        const { service_id: _, creator_id: __, creator_email: ___, ...formData } = req.body;

        // Handle SRF specifically if needed (JSON.parse Sample)
        if (service_id === 6 && typeof formData.Sample === 'string') {
            try {
                formData.Sample = JSON.parse(formData.Sample);
            } catch (e) {
                console.warn('⚠️ Failed to parse Sample JSON in legacy SRF adapter');
            }
        }

        req.body.form_data = formData;
    }

    console.log(`🔄 [ROUTER] Redirecting legacy /setTicket/${service_id} to Engine`);
    return engineTicket.create(req, res);
});


route.post('/pc_request', decodeTokenHT, hotsTicket.addTicketPCRequest)
route.post('/pc_request_detail', decodeTokenHT, hotsTicket.addTicketPCRequest)



// route.post('/upload_file', decodeTokenHT, uploadFileITSupport, hotsTicket.uploadFileITSupport)

route.get('/my_tiket', decodeTokenHT, hotsTicket.getMyTiket)
route.get('/all_tiket', decodeTokenHT, hotsTicket.getAllTiket)
route.get('/task_list_old', decodeTokenHT, hotsTicket.getTaskList_old)

route.get('/comment/:ticket_id', decodeTokenHT, hotsTicket.getTicketComment)
route.get('/comment/:ticket_id', decodeTokenHT, hotsTicket.getTicketComment)
route.post('/comment/:ticket_id', decodeTokenHT, uploadFileITComment, engineTicket.addComment)


route.get('/fullfilled_tiket_count', decodeTokenHT, hotsTicket.getFullFilledTiketCount)
route.get('/open_tiket_count', decodeTokenHT, hotsTicket.getOpenTiketCount)
route.get('/rejected_tiket_count', decodeTokenHT, hotsTicket.getRejectTiketCount)


route.get('/detail_old/:service_id/:ticket_id', decodeTokenHT, hotsTicket.getTicketDetail_old)
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