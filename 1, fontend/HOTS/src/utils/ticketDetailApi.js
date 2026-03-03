
getTicketDetail: async (req, res) => {
    let date = new Date();
    let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    let service_id = req.params.service_id;
    let ticket_id = req.params.ticket_id;

    if (service_id && ticket_id) {
        // Standardized query that works for all services using cstm_col/lbl_col structure
        let queryGetTicketDetail = `
        SELECT
            t.ticket_id,
            t.service_id,
            t.status_id,
            t.created_by,
            t.assigned_team,
            t.assigned_to,
            DATE_FORMAT(t.creation_date, '%Y-%m-%d %H:%i:%s') as creation_date,
            DATE_FORMAT(t.last_update, '%Y-%m-%d %H:%i:%s') as last_update,
            t.fulfilment_comment,
            t.reason,
            
            -- Service information
            s.service_name,
            s.service_description,
            s.form_json,
            
            -- Status information
            ts.status_name,
            ts.color_hex,
            
            -- User information
            CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
            CONCAT(ua.firstname, " ", ua.lastname) as assigned_to_username,
            
            -- Team information
            tm.team_name,
            
            -- Ticket details (cstm_col/lbl_col structure)
            td.cstm_col1, td.lbl_col1,
            td.cstm_col2, td.lbl_col2,
            td.cstm_col3, td.lbl_col3,
            td.cstm_col4, td.lbl_col4,
            td.cstm_col5, td.lbl_col5,
            td.cstm_col6, td.lbl_col6,
            td.cstm_col7, td.lbl_col7,
            td.cstm_col8, td.lbl_col8,
            td.cstm_col9, td.lbl_col9,
            td.cstm_col10, td.lbl_col10,
            td.cstm_col11, td.lbl_col11,
            td.cstm_col12, td.lbl_col12,
            td.cstm_col13, td.lbl_col13,
            td.cstm_col14, td.lbl_col14,
            td.cstm_col15, td.lbl_col15,
            td.cstm_col16, td.lbl_col16,
            
            -- Attachments
            (
                SELECT
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'attachment_id', a.attachment_id, 
                            'url', a.url,
                            'filename', a.filename,
                            'file_size', a.file_size,
                            'upload_date', DATE_FORMAT(a.upload_date, '%Y-%m-%d %H:%i:%s')
                        )
                    )
                FROM
                    t_attachment a
                WHERE
                    a.ticket_id = t.ticket_id
                    AND a.comment_id IS NULL
            ) as list_attachments,
            
            -- Approval workflow
            (
                SELECT
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', a.approver_id, 
                            'approval_order', a.approval_order,
                            'approver_name', CONCAT(u.firstname, " ", u.lastname),
                            'approval_status', a.approval_status,
                            'approval_date', DATE_FORMAT(a.approve_date, '%Y-%m-%d %H:%i:%s'),
                            'rejection_remark', a.rejection_remark,
                            'approval_comment', a.approval_comment
                        )
                    )
                FROM
                    t_approval_event a
                LEFT JOIN
                    user u ON u.user_id = a.approver_id
                WHERE
                    a.approval_id = t.ticket_id 
                ORDER BY a.approval_order
            ) AS list_approval,
            
            -- Team leader information
            (
                SELECT
                    tm.user_id
                FROM
                    m_team_member tm
                WHERE
                    tm.team_id = t.assigned_team
                    AND tm.team_leader = 1
                LIMIT 1
            ) AS team_leader_id,
            
            -- Workflow steps for this service
            (
                SELECT
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'step_id', ws.id,
                            'step_name', ws.step_name,
                            'step_order', ws.step_order,
                            'assigned_user_id', ws.assigned_user_id,
                            'assigned_team_id', ws.assigned_team_id,
                            'step_type', ws.step_type
                        )
                    )
                FROM
                    t_workflow_step ws
                WHERE
                    ws.workflow_group_id = s.m_workflow_groups
                ORDER BY ws.step_order
            ) AS workflow_steps

        FROM
            t_ticket t
        LEFT JOIN
            t_ticket_detail td ON td.ticket_id = t.ticket_id
        LEFT JOIN
            m_service s ON s.service_id = t.service_id
        LEFT JOIN
            m_ticket_status ts ON ts.status_id = t.status_id
        LEFT JOIN
            user uc ON uc.user_id = t.created_by
        LEFT JOIN
            user ua ON ua.user_id = t.assigned_to
        LEFT JOIN
            m_team tm ON tm.team_id = t.assigned_team
        WHERE
            t.ticket_id = ?
            AND t.service_id = ?
        `;

        let paramGetTicketDetail = [ticket_id, service_id];

        dbHots.execute(queryGetTicketDetail, paramGetTicketDetail, (err, results) => {
            if (err) {
                console.log(timestamp, `getTicketDetail error for service_id: ${service_id}, ticket_id: ${ticket_id}`, err);
                return res.status(500).send({
                    success: false,
                    message: err
                });
            } else {
                console.log(timestamp, `getTicketDetail success for service_id: ${service_id}, ticket_id: ${ticket_id}`);
                
                if (results.length > 0) {
                    // Process the result to structure the form data properly
                    let ticketData = results[0];
                    
                    // Convert cstm_col/lbl_col pairs back to form structure
                    let formData = {};
                    for (let i = 1; i <= 16; i++) {
                        let cstmCol = `cstm_col${i}`;
                        let lblCol = `lbl_col${i}`;
                        
                        if (ticketData[cstmCol] !== null && ticketData[lblCol] !== null) {
                            // Create field key from label (similar to form creation)
                            let fieldKey = ticketData[lblCol].toLowerCase().replace(/[^a-z0-9]/g, '_');
                            formData[fieldKey] = ticketData[cstmCol];
                        }
                        
                        // Remove the raw columns from response
                        delete ticketData[cstmCol];
                        delete ticketData[lblCol];
                    }
                    
                    // Add structured form data
                    ticketData.form_data = formData;
                    
                    // Parse form_json if exists for field definitions
                    if (ticketData.form_json) {
                        try {
                            ticketData.form_config = JSON.parse(ticketData.form_json);
                        } catch (parseError) {
                            console.log(timestamp, "Failed to parse form_json:", parseError);
                            ticketData.form_config = null;
                        }
                    }
                    
                    return res.status(200).send({ 
                        success: true,
                        data: [ticketData] 
                    });
                } else {
                    return res.status(404).send({ 
                        success: false,
                        message: "Ticket not found" 
                    });
                }
            }
        });
        
    } else {
        res.status(400).send({
            success: false,
            message: "Both service_id and ticket_id must be provided"
        });
        console.log(timestamp, "getTicketDetail: service_id or ticket_id is not provided");
    }
},
