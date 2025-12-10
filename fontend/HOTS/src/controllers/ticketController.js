const dbHots = require('../config/database');
const ticketService = require('../services/ticketService');
const approvalService = require('../services/approvalService');
const yellowTerminal = '\x1b[33m';
const magenta = '\x1b[35m';

const ticketController = {
    // Get My Tickets (user's own tickets)
    getMyTickets: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) as total FROM t_ticket t WHERE t.created_by = ?`;
        const baseQuery = `
            SELECT 
                t.ticket_id, t.creation_date, t.service_id, s.service_name, t.status_id,
                ts.status_name as status, ts.color_hex as color, t.assigned_to, t.assigned_team,
                tm.team_name, t.last_update, t.reason, t.fulfilment_comment,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                    ELSE 1
                END as approval_status,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', ae.approver_id,
                            'approver_name', CONCAT(u.firstname, ' ', u.lastname),
                            'approval_order', ae.approval_order,
                            'approval_status', ae.approval_status
                        )
                    )
                    FROM t_approval_event ae
                    LEFT JOIN user u ON u.user_id = ae.approver_id
                    WHERE ae.approval_id = t.ticket_id
                    ORDER BY ae.approval_order
                ) as list_approval,
                (
                    SELECT tm2.user_id
                    FROM m_team_member tm2
                    WHERE tm2.team_id = t.assigned_team AND tm2.team_leader = 1
                    LIMIT 1
                ) as team_leader_id
            FROM t_ticket t
            LEFT JOIN m_service s ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN m_team tm ON tm.team_id = t.assigned_team
            WHERE t.created_by = ?
            ORDER BY t.creation_date DESC
            LIMIT ? OFFSET ?
        `;

        try {
            const result = await ticketService.getTicketsWithPagination(
                baseQuery, countQuery, [user_id, user_id, limit, offset], limit, offset
            );

            console.log(timestamp, "GET MY TICKETS SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET MY TICKETS SUCCESS",
                ...result
            });
        } catch (err) {
            console.log(timestamp, "GET MY TICKETS ERROR: ", err);
            return res.status(502).send({
                success: false,
                message: err.message || err
            });
        }
    },

    // Get All Tickets (for admin/manager view)
    getAllTickets: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) as total FROM t_ticket`;
        const baseQuery = `
            SELECT 
                t.ticket_id, t.creation_date, t.service_id, s.service_name, t.status_id,
                ts.status_name as status, ts.color_hex as color, t.assigned_to, t.assigned_team,
                tm.team_name, t.last_update, t.reason, t.fulfilment_comment,
                CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                    ELSE 1
                END as approval_status,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', ae.approver_id,
                            'approver_name', CONCAT(u2.firstname, ' ', u2.lastname),
                            'approval_order', ae.approval_order,
                            'approval_status', ae.approval_status
                        )
                    )
                    FROM t_approval_event ae
                    LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                    WHERE ae.approval_id = t.ticket_id
                    ORDER BY ae.approval_order
                ) as list_approval,
                (
                    SELECT tm2.user_id
                    FROM m_team_member tm2
                    WHERE tm2.team_id = t.assigned_team AND tm2.team_leader = 1
                    LIMIT 1
                ) as team_leader_id
            FROM t_ticket t
            LEFT JOIN m_service s ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN m_team tm ON tm.team_id = t.assigned_team
            LEFT JOIN user u ON u.user_id = t.created_by
            ORDER BY t.creation_date DESC
            LIMIT ? OFFSET ?
        `;

        try {
            const result = await ticketService.getTicketsWithPagination(
                baseQuery, countQuery, [limit, offset], limit, offset
            );

            console.log(timestamp, "GET ALL TICKETS SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET ALL TICKETS SUCCESS",
                ...result
            });
        } catch (err) {
            console.log(timestamp, "GET ALL TICKETS ERROR: ", err);
            return res.status(502).send({
                success: false,
                message: err.message || err
            });
        }
    },

    // Get Task List (tickets assigned to user) - Updated with approval logic
    getTaskList: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        // Count total tasks including approval events
        const countQuery = `
            SELECT COUNT(DISTINCT t.ticket_id) as total 
            FROM t_ticket t
            LEFT JOIN t_approval_event ae ON ae.approval_id = t.ticket_id
            WHERE (
                t.assigned_to = ? OR 
                t.assigned_team IN (
                    SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ?
                ) OR
                (ae.approver_id = ? AND ae.approval_status = 0 AND ae.approval_order = t.current_step)
            )
            AND t.status_id IN (1, 2)
        `;

        const baseQuery = `
            SELECT DISTINCT
                t.ticket_id,
                t.creation_date,
                t.service_id,
                s.service_name,
                t.status_id,
                ts.status_name as status,
                ts.color_hex as color,
                t.assigned_to,
                t.assigned_team,
                tm.team_name,
                t.last_update,
                t.reason,
                t.fulfilment_comment,
                CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                d.dept_name as department_name,
                t.current_step,
                t.current_step as approval_level,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                    ELSE 1
                END as approval_status,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', ae.approver_id,
                            'approver_name', CONCAT(u2.firstname, ' ', u2.lastname),
                            'approval_order', ae.approval_order,
                            'approval_status', ae.approval_status,
                            'approval_date', ae.approve_date
                        )
                    )
                    FROM t_approval_event ae
                    LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                    WHERE ae.approval_id = t.ticket_id
                    ORDER BY ae.approval_order
                ) as list_approval,
                (
                    SELECT tm2.user_id
                    FROM m_team_member tm2
                    WHERE tm2.team_id = t.assigned_team AND tm2.team_leader = 1
                    LIMIT 1
                ) as team_leader_id
            FROM t_ticket t
            LEFT JOIN m_service s ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN m_team tm ON tm.team_id = t.assigned_team
            LEFT JOIN user u ON u.user_id = t.created_by
            LEFT JOIN m_department d ON d.dept_id = u.dept_id
            LEFT JOIN t_approval_event ae ON ae.approval_id = t.ticket_id
            WHERE (
                t.assigned_to = ? OR 
                t.assigned_team IN (
                    SELECT tm3.team_id FROM m_team_member tm3 WHERE tm3.user_id = ?
                ) OR
                (ae.approver_id = ? AND ae.approval_status = 0 AND ae.approval_order = t.current_step)
            )
            AND t.status_id IN (1, 2)
            ORDER BY t.creation_date DESC
            LIMIT ? OFFSET ?
        `;

        try {
            const result = await ticketService.getTicketsWithPagination(
                baseQuery, countQuery, [user_id, user_id, user_id, user_id, user_id, user_id, limit, offset], limit, offset
            );

            console.log(timestamp, "GET TASK LIST SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET TASK LIST SUCCESS",
                ...result
            });
        } catch (err) {
            console.log(timestamp, "GET TASK LIST ERROR: ", err);
            return res.status(502).send({
                success: false,
                message: err.message || err
            });
        }
    },

    // Get Task Count
    getTaskCount: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;

        let countQuery = `
            SELECT COUNT(*) as total_tasks
            FROM t_ticket t
            WHERE (t.assigned_to = ? OR t.assigned_team IN (
                SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ?
            )) AND t.status_id NOT IN (5, 6)
        `;

        dbHots.execute(countQuery, [user_id, user_id], (err, result) => {
            if (err) {
                console.log(timestamp, "GET TASK COUNT ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            console.log(timestamp, "GET TASK COUNT SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET TASK COUNT SUCCESS",
                count: result[0].total_tasks
            });
        });
    },

    // Upload Files
    uploadFiles: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).send({
                success: false,
                message: "No files uploaded"
            });
        }

        let insertPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                let insertQuery = `
                    INSERT INTO t_temp_upload (uploaded_by, file_path, filename, upload_date, is_used)
                    VALUES (?, ?, ?, NOW(), FALSE)
                `;
                
                dbHots.execute(insertQuery, [user_id, file.path, file.originalname], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            upload_id: result.insertId,
                            filename: file.originalname,
                            path: file.path,
                            size: file.size
                        });
                    }
                });
            });
        });

        Promise.all(insertPromises)
            .then(uploadedFiles => {
                console.log(timestamp, "FILES UPLOADED SUCCESSFULLY");
                return res.status(200).send({
                    success: true,
                    message: "FILES UPLOADED SUCCESSFULLY",
                    files: uploadedFiles
                });
            })
            .catch(err => {
                console.log(timestamp, "UPLOAD FILES ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            });
    },

    // Create New Ticket - Refactored to use services
    createTicket: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;
        let service_id = req.params.service_id;
        let { reason, upload_ids, ...formData } = req.body;

        if (!service_id || !reason) {
            return res.status(400).send({
                success: false,
                message: "service_id and reason are required"
            });
        }

        try {
            // Get service and workflow details
            const { service, workflowSteps } = await ticketService.getServiceWithWorkflow(service_id);

            // Determine assignment from first workflow step
            const firstStep = workflowSteps.length > 0 ? workflowSteps[0] : null;
            const assigned_team = firstStep ? firstStep.assigned_team_id : null;
            const assigned_to = firstStep ? firstStep.assigned_user_id : null;

            // Create ticket with details
            const ticketId = await ticketService.createTicket(service_id, user_id, assigned_team, assigned_to, reason);

            // Insert ticket detail rows with order_col
            const detailInsertPromises = [];
            for (let i = 1; i <= 16; i++) {
                const cstmColValue = formData[`cstm_col${i}`] || '';
                const lblColValue = formData[`lbl_col${i}`] || '';
                if (cstmColValue || lblColValue) {
                    detailInsertPromises.push(dbHots.promise().execute(`
                        INSERT INTO t_ticket_detail (
                            ticket_id, cstm_col, lbl_col, order_col
                        ) VALUES (?, ?, ?, ?)
                    `, [ticketId, cstmColValue, lblColValue, i]));
                }
            }
            await Promise.all(detailInsertPromises);

            // Handle file uploads
            if (upload_ids && upload_ids.length > 0) {
                await ticketService.handleTicketFileUploads(ticketId, upload_ids);
            }

            // Create approval events from workflow
            if (workflowSteps.length > 0) {
                await approvalService.createApprovalEvents(ticketId, workflowSteps);
            }

            // Execute custom functions
            await ticketService.executeCustomFunctions(service_id, ticketId);

            console.log(timestamp, "CREATE TICKET SUCCESS");
            return res.status(200).send({
                success: true,
                message: "TICKET CREATED SUCCESSFULLY",
                ticket_id: ticketId
            });

        } catch (error) {
            console.log(timestamp, "CREATE TICKET ERROR: ", error);
            return res.status(502).send({
                success: false,
                message: error.message || error
            });
        }
    },

    // Get Ticket Detail - Enhanced with approval fields
    getTicketDetail: (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
    
        let ticket_id = req.params.ticket_id;
    
        if (!ticket_id) {
            return res.status(400).send({
                success: false,
                message: "ticket_id must be provided"
            });
        }
    
        const queryGetTicketDetail = `
            SELECT 
                t.ticket_id,
                t.creation_date,
                t.service_id,
                s.service_name,
                t.status_id,
                s.widget,
                ts.status_name as status,
                ts.color_hex as color,
                t.assigned_to,
                t.assigned_team,
                tm.team_name,
                t.last_update,
                t.reject_reason as reason,
                t.fulfilment_comment,
                t.current_step,
                CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                dpt.department_id AS dept_id,
                dpt.department_name AS department_name,
                dpt.department_shortname AS dept_shortname,
    
                -- ✅ Dynamic Detail Rows
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'order_col', td.order_col,
                            'cstm_col', td.cstm_col,
                            'lbl_col', td.lbl_col
                        )
                        ORDER BY td.order_col
                    )
                    FROM t_ticket_detail td
                    WHERE td.ticket_id = t.ticket_id
                ) as detail_rows,
    
                -- ✅ Current approver info
                (
                    SELECT CONCAT(u3.firstname, ' ', u3.lastname)
                    FROM t_approval_event ae3
                    LEFT JOIN user u3 ON u3.user_id = ae3.approver_id
                    WHERE ae3.approval_id = t.ticket_id 
                    AND ae3.approval_order = t.current_step
                    LIMIT 1
                ) as current_approver_name,
    
                (
                    SELECT ae3.approver_id
                    FROM t_approval_event ae3
                    WHERE ae3.approval_id = t.ticket_id 
                    AND ae3.approval_order = t.current_step
                    LIMIT 1
                ) as current_approver_id,
    
                -- ✅ Approval status
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                    ELSE 1
                END as approval_status,
    
                -- ✅ Attachments
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'upload_id', f.upload_id,
                            'filename', f.filename,
                            'path', f.file_path,
                            'size', f.file_size
                        )
                    )
                    FROM t_file_upload f 
                    WHERE f.ticket_id = t.ticket_id
                ) as files,
    
                -- ✅ Approval event list
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', ae.approver_id,
                            'approver_name', CONCAT(u2.firstname, ' ', u2.lastname),
                            'approval_order', ae.approval_order,
                            'approval_status', ae.approval_status,
                            'approval_date', DATE_FORMAT(ae.approve_date, '%Y-%m-%d %H:%i:%s'),
                            'rejection_remark', ae.rejection_remark,
                            'approver_leader', ae.approver_leader
                        )
                    )
                    FROM t_approval_event ae
                    LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                    WHERE ae.approval_id = t.ticket_id
                    ORDER BY ae.approval_order
                ) as list_approval,
    
                (
                    SELECT tm2.user_id
                    FROM m_team_member tm2
                    WHERE tm2.team_id = t.assigned_team AND tm2.team_leader = 1
                    LIMIT 1
                ) as team_leader_id
    
            FROM t_ticket t
            LEFT JOIN m_service s ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN m_team tm ON tm.team_id = t.assigned_team
            LEFT JOIN user u ON u.user_id = t.created_by
            LEFT JOIN m_department dpt ON dpt.department_id = u.department_id
            WHERE t.ticket_id = ?
        `;
    
        dbHots.execute(queryGetTicketDetail, [ticket_id], (err, results) => {
            if (err) {
                console.log(timestamp, "GET TICKET DETAIL ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }
    
            if (!results.length) {
                return res.status(404).send({
                    success: false,
                    message: 'Ticket not found!'
                });
            }
    
            console.log(timestamp, "GET TICKET DETAIL SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET TICKET DETAIL SUCCESS",
                data: results[0]
            });
        });
    },
    

    // Get Ticket Attachments
    getTicketAttachments: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let ticket_id = req.params.ticket_id;

        if (!ticket_id) {
            return res.status(400).send({
                success: false,
                message: "ticket_id must be provided"
            });
        }

        let queryGetAttachments = `
            SELECT upload_id, filename, file_path, upload_date
            FROM t_temp_upload
            WHERE ticket_id = ? AND is_used = TRUE
            ORDER BY upload_date DESC
        `;

        dbHots.execute(queryGetAttachments, [ticket_id], (err, results) => {
            if (err) {
                console.log(timestamp, "GET TICKET ATTACHMENTS ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            console.log(timestamp, "GET TICKET ATTACHMENTS SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET TICKET ATTACHMENTS SUCCESS",
                data: results
            });
        });
    },

    // Approve Ticket - Refactored to use services
    approveTicket: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;
        let ticket_id = req.params.ticket_id;
        let { approval_order, comment } = req.body;

        if (!ticket_id || approval_order === undefined) {
            return res.status(400).send({
                success: false,
                message: "ticket_id and approval_order are required"
            });
        }

        try {
            // Update approval status
            await approvalService.updateApprovalStatus(ticket_id, user_id, approval_order, 1, comment);

            // Check if all approvals are completed
            const allCompleted = await approvalService.checkAllApprovalsCompleted(ticket_id);

            if (allCompleted) {
                await approvalService.updateTicketStatus(ticket_id, 3); // Status 3 = Approved
            }

            console.log(timestamp, "APPROVE TICKET SUCCESS");
            return res.status(200).send({
                success: true,
                message: "TICKET APPROVED SUCCESSFULLY"
            });

        } catch (error) {
            console.log(timestamp, "APPROVE TICKET ERROR: ", error);
            return res.status(502).send({
                success: false,
                message: error.message || error
            });
        }
    },

    // Reject Ticket - Refactored to use services
    rejectTicket: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        
        let user_id = req.dataToken.user_id;
        let ticket_id = req.params.ticket_id;
        let { approval_order, rejection_remark } = req.body;

        if (!ticket_id || approval_order === undefined || !rejection_remark) {
            return res.status(400).send({
                success: false,
                message: "ticket_id, approval_order, and rejection_remark are required"
            });
        }

        try {
            // Update approval status to rejected
            await approvalService.updateApprovalStatus(ticket_id, user_id, approval_order, 2, rejection_remark);

            // Update ticket status to rejected
            await approvalService.updateTicketStatus(ticket_id, 4); // Status 4 = Rejected

            console.log(timestamp, "REJECT TICKET SUCCESS");
            return res.status(200).send({
                success: true,
                message: "TICKET REJECTED SUCCESSFULLY"
            });

        } catch (error) {
            console.log(timestamp, "REJECT TICKET ERROR: ", error);
            return res.status(502).send({
                success: false,
                message: error.message || error
            });
        }
    }
};

module.exports = ticketController;
