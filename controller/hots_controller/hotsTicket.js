const {
    dbHots,
    dbQueryHots,
} = require("../../config/db");
const { uploadFile } = require("../order");
const path = require("path");
const archiver = require("archiver");

const FormLoader = require("../../core/form-loader");
const workflowEngine = require("../../core/workflow-engine");
const triggerEngine = require("../../core/trigger-engine");

const hotsCheckApprovalLevel = require("../../config/hotsCheckApprovalLevel");
// const { generateTokenHT, hashPasswordHT } = require("../config/encrypts"); 

const fs = require('fs');
const { hotsMailer, hotsSubmitMailer, hotsApproveRequest } = require('../../service/mailer/hots/hots_mailer');
const hotscustomfunctionController = require("./hotscustomfunctionController");

const magenta = '\x1b[35m';

let date = new Date();

let yellowTerminal = "\x1b[33m";



// UNTUK GENERATE ID
const generateID = (user_id, service_id, row_number) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    // Ensure service_id is a two-digit string
    const formattedServiceID = String(service_id).padStart(2, '0');

    return parseInt(`${year}${month}${day}${user_id}${formattedServiceID}${row_number + 1}`);
}

async function generateCustomTicketID(db, service_id, user_id) {
    const year = new Date().getFullYear().toString().slice(-2);
    const service = String(service_id).padStart(2, "0");
    const user = String(user_id).padStart(4, "0");

    // 🧩 Check last used ticket for this pattern
    const [rows] = await db.promise().query(
        `SELECT ticket_id 
         FROM t_ticket 
         WHERE ticket_id LIKE ? 
         ORDER BY ticket_id DESC 
         LIMIT 1`,
        [`${year}${service}${user}%`]
    );

    let running = "0001";
    if (rows.length > 0) {
        const last = rows[0].ticket_id.toString();
        const lastRun = parseInt(last.slice(-4)) || 0;
        running = String(lastRun + 1).padStart(4, "0");
    }

    return `${year}${service}${user}${running}`;
}

// UNTUK GENERATE NOMOR BELAKANG ID
const queryCheckTicketRow = `
SELECT COUNT(*) as r_number
FROM t_ticket t 
WHERE created_by = ? AND service_id = ?
`

const queryCheckTeamRow = `
select
	t.team_id,
	t.user_id,
	s.service_id,
	s.approval_level
from
	m_team_member t
left join
m_service s on
	t.team_id = s.team_id
where 
	t.team_leader = 1
and
s.service_id  = ?

`

const queryCheckSuperiorRow = `
select
	u.superior_id,
	u.final_superior_id
from
	user u
where
	u.user_id = ?
`


module.exports = {
    addTicketITSupport: async (req, res) => {
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        let service_id = 7; // IT Support Request
        const { type, issue_desc } = req.body;

        if (req.dataToken.user_type) {
            try {
                const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [req.dataToken.user_id]);
                const { superior_id: superiorID, final_superior_id: headId } = resSuperior[0];

                const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                const approvalLevel = resTeam[0]?.approval_level;
                let paramTicketCheck = [req.dataToken.user_id, service_id];
                const [resRow] = await dbHots.promise().query(queryCheckTicketRow, paramTicketCheck);

                // Insert ticket
                let ticketId = generateID(req.dataToken.user_id, service_id, resRow[0].r_number);

                let queryInsertTicket = `
                    INSERT INTO t_ticket 
                    (ticket_id, service_id, status_id, created_by, assigned_team, 
                    creation_date, reason)
                    VALUES 
                    (?, ?, 0, ?, ?, 
                    now(), ?);
    
                    INSERT INTO t_it_support (ticket_id, type)
                    VALUES (?, ?);
                `;
                let paramInsertTicket = [
                    ticketId, service_id, req.dataToken.user_id, service_id, issue_desc,
                    ticketId, type,
                ];
                await dbHots.promise().query(queryInsertTicket, paramInsertTicket);

                // Insert approval events based on approval level
                const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);

                if (paramInsertApproval.length > 0) {
                    const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                    await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                }

                // File attachment
                if (req.files && req.files.length > 0) {
                    let queryInsertFiles = `INSERT INTO t_attachment (ticket_id, url) VALUES (?, ?);`;
                    for (let file of req.files) {
                        let file_url = `/public/files/hots/it_support/${file.filename}`;
                        await dbHots.promise().query(queryInsertFiles, [ticketId, file_url]);
                    }
                }
                // Final response
                res.status(200).send({
                    success: true,
                    message: "Ticket has been created",
                    ticket_number: ticketId
                });
                console.log(timestamp, "addTicketITSupport success", ticketId);

            } catch (err) {
                res.status(500).send({
                    success: false,
                    message: err.message
                });
                console.log(timestamp, "error addTicketITSupport", err);
            }
        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            });
            console.log(timestamp, "addTicketITSupport is Unauthorized");
        }
    },

    addTicketPCRequest: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // 1 === PCRequest
        let service_id = 1;
        const { job_desc, reason, laptop_spec_id, old_device, date_acquisition, old_device_spec } = req.body;



        if (req.dataToken.user_id) {
            try {
                const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [req.dataToken.user_id]);
                const { superior_id: superiorID, final_superior_id: headId } = resSuperior[0];

                const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                const approvalLevel = resTeam[0]?.approval_level;

                let paramTicketCheck = [req.dataToken.user_id, service_id];
                const [resRow] = await dbHots.promise().query(queryCheckTicketRow, paramTicketCheck);
                let ticketId = generateID(req.dataToken.user_id, service_id, resRow[0].r_number);

                let queryInsertTicket = old_device ? `
                INSERT INTO t_ticket 
                (ticket_id, service_id, status_id, created_by, assigned_team, 
                creation_date, reason)
                VALUES
                (?, ?, 0, ?, ?,
                now(), ? );

                INSERT INTO t_it_support
                (ticket_id, job_desc, laptop_spec_id, old_device, date_acquisition, old_device_spec)
                VALUES
                (?, ?, ?, ?, ?, ?);

                `:
                    `
                INSERT INTO t_ticket 
                (ticket_id, service_id, status_id, created_by, assigned_team, 
                creation_date, reason)
                VALUES
                (?, ?, 0, ?, ?,
                now(), ? );

                INSERT INTO t_it_support
                (ticket_id, job_desc,  laptop_spec_id)
                VALUES
                (?, ?, ?);

                `

                let paramInsertTicket =
                    old_device ? [
                        ticketId, service_id, req.dataToken.user_id, service_id, reason,
                        ticketId, job_desc, laptop_spec_id, old_device, date_acquisition, old_device_spec
                    ]
                        :
                        [
                            ticketId, service_id, req.dataToken.user_id, service_id, reason,
                            ticketId, job_desc, laptop_spec_id
                        ]

                await dbHots.promise().query(queryInsertTicket, paramInsertTicket);


                const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);

                if (paramInsertApproval.length > 0) {
                    const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                    await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                }

                res.status(200).send({
                    success: true,
                    message: "ticket has been created",
                    ticket_number: ticketId
                })
                console.log(timestamp, "add Ticket PC Request success ")


                hotsMailer(
                    mailAddress, 'Your IT Support ticket just created!', `
                    <div>
                    <p> Dear ${fullName}, 
                    <div>
                    `);

            } catch (err) {
                console.log("old_device_spec", old_device_spec)

                res.status(500).send({
                    success: false,
                    message: err.message
                });
                console.log(timestamp, "error addTicketPCRequest", err);
            }




        }
        else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            })
            console.log(timestamp, " addTicketPCRequest is Unauthorized ")
        }

    },

    testEmail: async (req, res) => {
        const timestamp = new Date().toLocaleString('id'); // Get timestamp in the Indonesian locale
        const mailAddress = "josua.prima@gmail.com"
        const fullName = "Yosua Prima Gultom"
        try {
            // Check if mailAddress is provided and not empty
            if (mailAddress && mailAddress.length > 0) {
                // Call the hotsMailer function to send the email
                await hotsMailer(
                    mailAddress,
                    'Your IT Support ticket has been created!',
                    `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <p>Dear ${fullName},</p>
                        <p>Your IT Support ticket has just been created! Our team will review it and get back to you shortly.</p>
                        <p>Best regards,</p>
                        <p>IT Support Team</p>
                        <p><small>Generated on: ${timestamp}</small></p>
                    </div>
                    `
                );

                // Send success response
                return res.status(200).json({ message: 'Email sent successfully!' });
            } else {
                // Handle missing email address
                return res.status(400).json({ error: 'Invalid or missing email address.' });
            }
        } catch (error) {
            console.error('Error sending email:', error);
            // Send error response
            return res.status(500).json({ error: 'Failed to send email.', details: error.message });
        }
    }

    ,
    setTicket: async (req, res) => {
        let timestamp = new Date().toLocaleString('id');
        let service_id = req.params.service_id;
        let user_id = req.dataToken.user_id;
        let { ticket_reason, service_reason, } = req.body;

        const mailAddress = await dbQueryHots(`SELECT email  FROM USER WHERE user_id = ${req.dataToken.user_id}`);
        const fullName = `${req.dataToken.firstname}  ${req.dataToken.lastname} `




        if (service_id) {
            switch (parseInt(service_id)) {

                case 11: // Pricing Structure
                    try {

                        let {
                            analyst,
                            analyst_name,
                            country,
                            rm_id,
                            region_id,
                            distributor,
                            port,
                            proposal_no,
                            proposal_date,
                            sku_id,

                            CBP,
                            RBP,
                            DBP,
                            CIF,
                            FOB,
                            TP1,
                            TP2,
                            Incentive,
                            COGS,
                            GP_after_freight,
                            curr_code,
                            SKU,

                            file,



                        } = req.body;

                        const localCurrencyData = JSON.parse(req.body.localCurrencyData); // Local Currency data
                        const usdCurrencyData = JSON.parse(req.body.usdCurrencyData);


                        if (!localCurrencyData || localCurrencyData.length === 0) {
                            return res.status(400).json({ message: "No data received" });
                        }

                        if (!usdCurrencyData || usdCurrencyData.length === 0) {
                            return res.status(400).json({ message: "No data received" });
                        }


                        const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [user_id]);
                        const { superior_id: superiorID } = resSuperior[0];

                        const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                        const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                        const approvalLevel = resTeam[0]?.approval_level;

                        const [resRow] = await dbHots.promise().query(queryCheckTicketRow, [user_id, service_id]);

                        // Generate Ticket ID
                        let ticketId = await generateID(user_id, service_id, resRow[0].r_number);

                        // Insert Ticket and Idea Bank Entry
                        let queryInsertTicket = `
                        INSERT INTO t_ticket (
                        ticket_id, created_by, reason, service_id, status_id, assigned_team, creation_date
                        )
                        VALUES (
                        ?, ?, ?, 11, 0, 11, now()
                        );

                        

                            INSERT INTO t_ps_header
                            (
                                analyst_id,
                                analyst_name,
                                country_id,
                                region_id,
                                distributor_id,
                                port_id,
                                proposal_id,
                                sku_id,
                                ticket_id,
                                proposal_date 
                                )
                            VALUES
                            (
                            ?,?,?,?,?,
                            ?,?,?,?,?
                            );
                    `;

                        await dbHots.promise().query(
                            queryInsertTicket,
                            [
                                ticketId,
                                user_id,
                                "Need Approval BOD For Pricing Structure",






                                analyst,
                                analyst_name,
                                country,
                                region_id,
                                distributor,
                                port,
                                proposal_no,
                                sku_id,
                                ticketId,
                                proposal_date
                            ]
                        );

                        let queryInsertTicket_Summary = `
                        INSERT INTO t_ps_summary
                            (
                                CBP,
                                RBP,
                                DBP,
                                CIF,
                                FOB,
                                TP1,
                                TP2,
                                TP3,
                                Incentive,
                                COGS,
                                GP_after_freight,
                                curr_code,
                                ticket_id
                            )
                        VALUES
                            (
                            ?,?,?,?,?,
                            ?,?,?,?,?,
                            ?,?,?
                        );
                    `;

                        await dbHots.promise().query(
                            queryInsertTicket_Summary,
                            [
                                localCurrencyData[0]?.localCurrency || 0,  // CBP
                                localCurrencyData[1]?.localCurrency || 0,  // RBP
                                localCurrencyData[2]?.localCurrency || 0,  // DBP
                                localCurrencyData[3]?.localCurrency || 0,  // CIF
                                localCurrencyData[4]?.localCurrency || 0,  // FOB
                                localCurrencyData[5]?.localCurrency || 0,  // TP1
                                localCurrencyData[6]?.localCurrency || 0,  // TP2
                                localCurrencyData[7]?.localCurrency || 0,  // TP3
                                localCurrencyData[8]?.localCurrency || 0,  // Incentive
                                localCurrencyData[9]?.localCurrency || 0,  // COGS
                                localCurrencyData[10]?.localCurrency || 0,
                                0,
                                ticketId
                            ]
                        );

                        await dbHots.promise().query(
                            queryInsertTicket_Summary,
                            [
                                usdCurrencyData[0]?.usdCurrency || 0,     // CBP (USD)
                                usdCurrencyData[1]?.usdCurrency || 0,     // RBP (USD)
                                usdCurrencyData[2]?.usdCurrency || 0,     // DBP (USD)
                                usdCurrencyData[3]?.usdCurrency || 0,     // CIF (USD)
                                usdCurrencyData[4]?.usdCurrency || 0,     // FOB (USD)
                                usdCurrencyData[5]?.usdCurrency || 0,     // TP1 (USD)
                                usdCurrencyData[6]?.usdCurrency || 0,     // TP2 (USD)
                                usdCurrencyData[7]?.usdCurrency || 0,     // TP3 (USD)
                                usdCurrencyData[8]?.usdCurrency || 0,     // Incentive (USD)
                                usdCurrencyData[9]?.usdCurrency || 0,     // COGS (USD)
                                usdCurrencyData[10]?.usdCurrency || 0,
                                1,
                                ticketId
                            ]
                        );

                        // Insert Approval Events

                        const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);
                        if (paramInsertApproval.length > 0) {
                            const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                            await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                        }

                        const firstapprovermailAddress = await dbQueryHots(`select
                            u.email,
                            u.user_id
                        from
                            user u
                        left join
                        m_team_member mtm on
                            u.user_id = mtm.user_id
                        where
                        u.user_id = 
                        ${paramInsertApproval[0][2]}
                        `);



                        // File Attachments
                        if (req.files && req.files.length > 0) {
                            let queryInsertFiles = `INSERT INTO t_attachment (ticket_id, url) VALUES (?, ?);`;
                            for (let file of req.files) {
                                let file_url = `/public/files/pricing_structure/${file.filename}`;
                                await dbHots.promise().query(queryInsertFiles, [ticketId, file_url]);
                            }
                        }



                        // Call the hotsMailer function to send the email
                        await hotsMailer(
                            mailAddress,
                            `[No-Reply] [Ticket ID: ${ticketId}] Your Ticket Has Been Submitted `,
                            `
                                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <p>Dear ${fullName},</p>
                                    <p>Thank you for submitting your ticket. Below are the details of your request: </p>
                                    <p><strong>Service </strong>: ${service_id} </p>
                                    <p>IT Support Team</p>
                                    <p><strong>Ticket Details:</strong> </p>
                                    <table>
                                        <thead>
                                        <tr>

                                        <td>
                                            ticketId
                                        </td>
                                        <td>
                                            analyst_name
                                        </td>
                                        <td>
                                            proposal_no
                                        </td>
                                        <td>
                                            matcode
                                        </td>
                                        <td>
                                            proposal_date
                                        </td>

                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                              <td>
                                                ${ticketId}
                                            </td>
                                            <td>
                                                ${analyst_name}

                                            </td>
                                            <td>
                                                ${proposal_no}
                                            </td>
                                            <td>
                                                ${sku_id}
                                            </td>

                                            <td>
                                                ${proposal_date}
                                            </td>

                                        </tr>
                                        </tbody>
                                    </table>
                                    <p>Your ticket has been successfully received and is currently awaiting processing. </p>
                                    <p> <strong> Approval List: </strong></p>
                                    <p>For additional details or to track your request, please visit your ticket in the helpdesk system.</p>
                                    <p>Thank you </p>
                                </div>
                                `
                        );
                        if (firstApproverResult.length > 0) {
                            hotsMailer(
                                firstapprovermailAddress,
                                `[No-Reply] [Ticket ID: {Ticket_Number}] Approval Required `,
                                `
                                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <p>Dear ${fullName},</p>
                                    <p>A new ticket has been submitted and requires your approval. Please review the details below:  </p>
                                    <p><strong>Service </strong>: ${service_id} </p>
                                    <p><strong>Ticket ID </strong>: ${ticketId} </p>
                                    </br>
                                    <p>Requester Information: </p>
                                    <p><strong>Requested by	 </strong>: ${service_id} </p>
                                    <p><strong>Department </strong>: IOD </p>
                                    <p><strong>Submission Date </strong>: ${timestamp} </p>
                                    </br>
                                    <p><strong>Ticket Details </strong>:  </p>
                                    <table>
                                        <thead>
                                        <tr>

                                        <td>
                                            ticketId
                                        </td>
                                        <td>
                                            analyst_name
                                        </td>
                                        <td>
                                            proposal_no
                                        </td>
                                        <td>
                                            matcode
                                        </td>
                                        <td>
                                            proposal_date
                                        </td>

                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                              <td>
                                                ${ticketId}
                                            </td>
                                            <td>
                                                ${analyst_name}

                                            </td>
                                            <td>
                                                ${proposal_no}
                                            </td>
                                            <td>
                                                ${sku_id}
                                            </td>

                                            <td>
                                                ${proposal_date}
                                            </td>

                                        </tr>
                                        </tbody>
                                    </table>
                                    <p>Your ticket has been successfully received and is currently awaiting processing. </p>
                                    <p> <strong> Approval List: </strong></p>
                                    <p>For additional details or to track your request, please visit your ticket in the helpdesk system.</p>
                                    <p>Thank you </p>
                                </div>
                                `
                            );
                        } else {
                            console.log("email not sent for")
                        }

                        // Send success response
                        // } else {
                        //     // Handle missing email address
                        //     return res.status(400).json({ error: 'Invalid or missing email address.' });
                        // }

                        // Final Response
                        res.status(200).send({
                            success: true,
                            message: "Ticket has been created",
                            ticket_number: ticketId,
                        });


                        console.log(timestamp, "Input Ticket Success ID : ", ticketId, "service : ", service_id);

                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            message: err.message,
                        });
                        console.log(timestamp, "Error in Pricing Structure", err);
                    }
                    break;

                case 10: // Data Update
                    try {
                        let {
                            type,
                            issue_desc
                        } = req.body;

                        const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [user_id]);
                        const { superior_id: superiorID } = resSuperior[0];

                        const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                        const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                        const approvalLevel = resTeam[0]?.approval_level;

                        const [resRow] = await dbHots.promise().query(queryCheckTicketRow, [user_id, service_id]);

                        // Generate Ticket ID
                        let ticketId = await generateID(user_id, service_id, resRow[0].r_number);

                        // Insert Ticket and Idea Bank Entry
                        let queryInsertTicket = `
                            INSERT INTO t_ticket (ticket_id, created_by, reason, service_id, status_id, assigned_team, creation_date)
                            VALUES (?, ?, ?, 9, 0, 9, now());
    
                            INSERT INTO t_data_update (ticket_id, system_name) 
                            VALUES (?, ?);
                        `;

                        await dbHots.promise().query(queryInsertTicket, [ticketId, user_id, issue_desc, ticketId, type]);

                        // Insert Approval Events

                        const paramInsertApproval = [];

                        paramInsertApproval.push([ticketId, 1, superiorID]);

                        if (type === 101) {
                            paramInsertApproval.push([ticketId, 2, 1078]);
                        } else {
                            paramInsertApproval.push([ticketId, 2, 1001]);
                        }

                        if (paramInsertApproval.length > 0) {
                            const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                            await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                        }



                        // File Attachments
                        if (req.files && req.files.length > 0) {
                            let queryInsertFiles = `INSERT INTO t_attachment (ticket_id, url) VALUES (?, ?);`;
                            for (let file of req.files) {
                                let file_url = `/public/files/hots/it_support/${file.filename}`;
                                await dbHots.promise().query(queryInsertFiles, [ticketId, file_url]);
                            }
                        }

                        // Final Response
                        res.status(200).send({
                            success: true,
                            message: "Ticket has been created",
                            ticket_number: ticketId,
                        });
                        console.log(timestamp, "Input Ticket Success ID : ", res.ticket_number, "service : ", service_id);

                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            message: err.message,
                        });
                        console.log(timestamp, "Error in IdeaBank", err);
                    }
                    break;

                case 9: // Data Update
                    try {
                        let {
                            type,
                            issue_desc
                        } = req.body;

                        const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [user_id]);
                        const { superior_id: superiorID } = resSuperior[0];

                        const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                        const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                        const approvalLevel = resTeam[0]?.approval_level;

                        const [resRow] = await dbHots.promise().query(queryCheckTicketRow, [user_id, service_id]);

                        // Generate Ticket ID
                        let ticketId = await generateID(user_id, service_id, resRow[0].r_number);

                        // Insert Ticket and Idea Bank Entry
                        let queryInsertTicket = `
                            INSERT INTO t_ticket (ticket_id, created_by, reason, service_id, status_id, assigned_team, creation_date)
                            VALUES (?, ?, ?, 9, 0, 9, now());
    
                            INSERT INTO t_data_update (ticket_id, system_name) 
                            VALUES (?, ?);
                        `;

                        await dbHots.promise().query(queryInsertTicket, [ticketId, user_id, issue_desc, ticketId, type]);

                        // Insert Approval Events

                        const paramInsertApproval = [];

                        paramInsertApproval.push([ticketId, 1, superiorID]);

                        if (type === 101) {
                            paramInsertApproval.push([ticketId, 2, 1078]);
                        } else {
                            paramInsertApproval.push([ticketId, 2, 1001]);
                        }

                        if (paramInsertApproval.length > 0) {
                            const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                            await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                        }



                        // File Attachments
                        if (req.files && req.files.length > 0) {
                            let queryInsertFiles = `INSERT INTO t_attachment (ticket_id, url) VALUES (?, ?);`;
                            for (let file of req.files) {
                                let file_url = `/public/files/hots/it_support/${file.filename}`;
                                await dbHots.promise().query(queryInsertFiles, [ticketId, file_url]);
                            }
                        }

                        // Final Response
                        res.status(200).send({
                            success: true,
                            message: "Ticket has been created",
                            ticket_number: ticketId,
                        });
                        console.log(timestamp, "Input Ticket Success ID : ", res.ticket_number, "service : ", service_id);

                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            message: err.message,
                        });
                        console.log(timestamp, "Error in IdeaBank", err);
                    }
                    break;


                case 8: // Idea Bank
                    try {
                        const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [user_id]);
                        const { superior_id: superiorID } = resSuperior[0];

                        const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                        const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                        const approvalLevel = resTeam[0]?.approval_level;

                        const [resRow] = await dbHots.promise().query(queryCheckTicketRow, [user_id, service_id]);

                        // Generate Ticket ID
                        let ticketId = await generateID(user_id, service_id, resRow[0].r_number);

                        // Insert Ticket and Idea Bank Entry
                        let queryInsertTicket = `
                            INSERT INTO t_ticket (ticket_id, created_by, reason, service_id, status_id, assigned_team, creation_date)
                            VALUES (?, ?, ?, 8, 0, 8, now());
    
                            INSERT INTO t_idea_bank (ticket_id, service_reason) 
                            VALUES (?, ?);
                        `;

                        await dbHots.promise().query(queryInsertTicket, [ticketId, user_id, ticket_reason, ticketId, service_reason]);

                        // Insert Approval Events
                        const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);
                        if (paramInsertApproval.length > 0) {
                            const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                            await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                        }

                        // File Attachments
                        if (req.files && req.files.length > 0) {
                            let queryInsertFiles = `INSERT INTO t_attachment (ticket_id, url) VALUES (?, ?);`;
                            for (let file of req.files) {
                                let file_url = `/public/files/hots/it_support/${file.filename}`;
                                await dbHots.promise().query(queryInsertFiles, [ticketId, file_url]);
                            }
                        }

                        // Final Response
                        res.status(200).send({
                            success: true,
                            message: "Ticket has been created",
                            ticket_number: ticketId,
                        });
                        console.log(timestamp, "Input Ticket Success ID : ", res.ticket_number, "service : ", service_id);

                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            message: err.message,
                        });
                        console.log(timestamp, "Error in IdeaBank", err);
                    }
                    break;

                case 6: // SRF Sample category  form

                    let {
                        Requestby,
                        SampleCategory,
                        Division,
                        Plant,
                        Location,
                        DeliverTo,
                        SRFNO,
                        Total,
                        Sample,
                        samplecatgroup
                    } = req.body
                    const sampleData = JSON.parse(req.body.Sample); // Parse JSON data

                    // console.log("req.body", req.body)
                    // console.log("req.body", req.body.Sample)
                    // console.log(sampleData); 

                    try {
                        const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [user_id]);
                        const { superior_id: superiorID } = resSuperior[0];

                        const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                        const team_leader = resTeam.map(row => row.user_id); // Collects all team leaders as an array
                        const approvalLevel = resTeam[0]?.approval_level;

                        const querycheckticketsrf =
                            `
                        select
                            COUNT(*) as r_number
                        from
                            t_srf t
                        where
                            plant_id = ?
                            and 
                            samplecat_id = ?
                        `

                        const [resRowSRF] = await dbHots.promise().query(querycheckticketsrf, [Plant, samplecatgroup]);

                        let paramTicketCheck = [req.dataToken.user_id, service_id];
                        const [resRow] = await dbHots.promise().query(queryCheckTicketRow, paramTicketCheck);


                        const paddedNumber = String(resRowSRF[0].r_number + 1).padStart(3, '0');
                        const formattedSRFNO = `${paddedNumber + SRFNO}`
                        // Generate Ticket ID
                        let ticketId = await generateID(user_id, service_id, resRow[0].r_number);

                        // Insert Ticket and Idea Bank Entry
                        let queryInsertTicket = `
                            INSERT INTO t_ticket (ticket_id, created_by, reason, service_id, status_id, assigned_team, creation_date)
                            VALUES (?, ?, ?, 6, 0, 6, now() );
    
                            INSERT INTO t_srf (ticket_id, plant_id, srf_no, deliver_to, request_by, samplecat_id, purpose) 
                            VALUES (?, ?, ?, ?, ?, ?, ?);

                           
                        `;

                        await dbHots.promise().query(queryInsertTicket,
                            [ticketId, user_id, ticket_reason,
                                ticketId, Plant, formattedSRFNO, DeliverTo, user_id, SampleCategory, service_reason,
                            ]
                        );

                        let queryInsertSRFDetails = `
                                INSERT INTO td_srf (ticket_id, item_name, quantity, contain)
                                VALUES (?, ?, ?, ?);
                            `;

                        // Loop through the Sample array to insert each item
                        for (const item of sampleData) {
                            await dbHots.promise().query(queryInsertSRFDetails, [
                                ticketId,
                                item.name,  // Assuming the object has item_name
                                item.quantity,   // Assuming the object has quantity
                                //item.quantity_uom, // Assuming the object has quantity_uom
                                item.contain || 0,    // Assuming the object has contain
                                //item.contain_uom  // Assuming the object has contain_uom
                            ]);
                        }

                        // Insert Approval Events
                        const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);
                        if (paramInsertApproval.length > 0) {
                            const queryInsertApproval = `INSERT INTO t_ticket_event (approval_id, approval_order, approver_id) VALUES ?`;
                            await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                        }


                        // Final Response
                        console.log(timestamp, `Success set ticket with service 06 for ${user_id}`)
                        res.status(200).send({
                            success: true,
                            message: "Ticket has been created",
                            ticket_number: ticketId,
                        });
                        console.log(timestamp, "Input Ticket Success ID : ", res.ticket_number, "service : ", service_id);

                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            message: err.message,
                        });
                        console.log(timestamp, "Error in add Ticket for SRF service id 6");
                        console.log('===========================================================');

                        console.log(err);

                    }
                    break;

                default:
                    console.log("Trying to set Ticket without service")
                    res.status(400).send({
                        success: false,
                        message: "Invalid service_id provided.",
                    });
            }
        } else {
            res.status(400).send({
                success: false,
                message: "service_id must be provided.",
            });
            console.log(timestamp, "Service ID is not provided.");
        }
    }



    // ALASAN KENAPA DISATUKAN UPLOAD DAN SUBMIT, SOALNYA KALO SATU-SATU GA KETAHUAN SALAH SATU GAGAL ATAU MASUK
    , uploadFileITSupport: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {
            try {
                // let fileIsExist = req.files[0]
                let fileUrl = `/files/hots/it_support-${req.files[0].filename}`
                let fileOriginalName = `${req.files[0].originalname}`
                let newName = req.newName

                res.status(200).send({
                    newName,
                    fileUrl,
                    fileOriginalName,
                    message: 'upload success!'
                });
                console.log(timestamp + "filr uploaded")

            } catch (error) {
                res.status(500).send(
                    {
                        error,
                        message: 'something error while upload files :('
                    }
                );
                console.log(timestamp + "Error upload files:", error);
                fs.unlinkSync(`.public/files/hots/it_support-${req.files[0].filename}`)
            }
        } else {
            res.status(200).send({
                success: false,
                message: 'Unauthorized!'
            });
            console.log(timestamp + "Unauthorized file upload")
        }
    },

    getMyTiket: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        ///hots_ticket/my_tiket
        const status = req.query.status || "";
        const category = req.query.category || "";
        const searchBarOnTop = req.query.search || "";

        const limit = parseInt(req.query.limit, 10) || 10;
        const currentPage = parseInt(req.query.page, 10) || 1;




        if (req.dataToken.user_id) {

            let queryGetMyTiket = `
            select
                t.ticket_id,
                DATE_FORMAT(t.creation_date, '%d-%b-%Y %H:%i') as creation_date,
                s.service_id,
                s.service_name,
                s.approval_level,
                CONCAT(u.firstname, " ", u.lastname) assigned_to,
                ts.status_name status,
                ts.color,
                tm.team_name,
                t.last_update,
                t.fulfilment_comment,
                count(ae.approve_date) approval_status,
                (
                    SELECT
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'approver_id', a.approver_id, 
                                'approval_order', a.approval_order,
                                'approver_name', CONCAT(u.firstname, " ", u.lastname),
                                'approval_status', a.approval_status
                            )
                        )
                    FROM
                        t_ticket_event a
                    LEFT JOIN
                        user u ON u.user_id = a.approver_id
                    WHERE
                        a.approval_id = t.ticket_id 
                ) AS list_approval,
                  (
                            SELECT
                                tm.user_id
                            FROM
                                m_team_member tm
                            WHERE
                                tm.team_id = tta.assigned_id
                            AND
                                tm.team_leader = 1
                            and 
                                tta.assigned_type="team"
                            LIMIT 1
                        ) AS team_leader_id
                from
                    t_ticket t
                left join m_service s on
                    t.service_id = s.service_id
                 LEFT JOIN t_ticket_assignment tta ON 
                    t.ticket_id = tta.ticket_id
                LEFT JOIN user u ON 
                    u.user_id = tta.assigned_id 
                    AND 
                    tta.assigned_type = 'user'
                left join m_ticket_status ts on
                    ts.status_id = t.status_id
                  LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
                left join t_ticket_event ae on
                    t.ticket_id = ae.approval_id
                where
                t.created_by = ${req.dataToken.user_id}
            
            `

            let countQuery = `
            SELECT COUNT(*) AS total_count
            FROM t_ticket t
            LEFT JOIN m_service s ON t.service_id = s.service_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id
            LEFT JOIN user u ON 
                u.user_id = tta.assigned_id 
                AND tta.assigned_type = 'user'
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id

            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id


              LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'


            WHERE created_by = ${req.dataToken.user_id}
            `;



            if ((status !== "" || status) && status !== "-1") {
                queryGetMyTiket += ` AND t.status_id = ${status} `;
                countQuery += ` AND t.status_id = ${status} `;
            }

            if ((category !== "" || category) && category !== "-1") {
                queryGetMyTiket += ` AND  s.service_id = ${category} `;
                countQuery += ` AND  s.service_id = ${category} `;
            }

            if (searchBarOnTop && searchBarOnTop !== "") {
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%')  ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%')  ) `;
            }

            queryGetMyTiket += `  group by  
                                    t.ticket_id,
                                    ae.approval_id `

            queryGetMyTiket += `  ORDER BY t.creation_date DESC `


            if (limit >= 1) {
                queryGetMyTiket += ` LIMIT ${limit} `;;
                countQuery += ` LIMIT ${limit} `;
            }

            if (currentPage <= 2 || currentPage !== null) {
                queryGetMyTiket += ` OFFSET ${(currentPage - 1) * limit} `;
            }




            dbHots.query(countQuery, (err, results) => {

                if (err) {
                    res.status(501).send({
                        success: false,
                        err
                    })

                } else {
                    const totalData = results[0].total_count;
                    const totalPage = Math.ceil(totalData / limit);
                    dbHots.query(queryGetMyTiket, (err1, results1) => {
                        if (err1) {
                            console.log(queryGetMyTiket)
                            res.status(502).send({
                                success: false,
                                err1
                            })
                            console.log(timestamp, "error caught at getMyTicket ", err)
                        } else {


                            res.status(200).send({
                                success: true,
                                totalData,
                                totalPage,
                                data: results1
                            });
                            console.log(timestamp, "successfully getMyTicket  ", req.dataToken.user_id)
                        }
                    })
                }
            })
        } else {
            res.status(500).send({
                success: false,
                message: "UNAUTHORIZED ",

            })
            console.log(timestamp, " getMyTicket Unauthorized ")
        }

    }
    ,
    getTicketDetail_old: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let service_id = req.params.service_id
        let ticket_id = req.params.ticket_id

        if (service_id) {

        } else {
            res.status(500).send({
                success: false,
                message: "service_id must be provided "
            })
            console.log(timestamp, "getTicketDetail service_id is not provided ")
        }


    },
    setApprove: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let service_id = req.params.service_id
        let ticket_id = req.params.ticket_id

        let user_id = req.dataToken.user_id
        let assign_to = req.body.data_additional
        //important : data additional bisa jadi apa aja, bisa jadi assign_to di halaman it support, etc.
        if (service_id) {
            switch (parseInt(service_id)) {

                case 11: // IT tech support
                    let querySetApprovalPricingstructure =
                        `
                        UPDATE t_ticket_event
                        SET 
                            approve_date = NOW(), 
                            approval_status = 1
                        WHERE 
                            approval_id = ?
                            and
                            approver_id = ?
                    `;

                    let queryUpdatePricingstructure = `
                        UPDATE t_ticket
                        SET 
                            status_id = 1,
                            last_update = NOW(),
                            assigned_to = ? 
                        WHERE 
                            ticket_id = ?;
                    `;



                    let paramSetApprovalPricingstructure = [ticket_id, user_id];
                    let paramUpdatePricingstructure = [assign_to, ticket_id];

                    try {
                        await dbHots.execute(querySetApprovalPricingstructure, paramSetApprovalPricingstructure);
                        await dbHots.execute(queryUpdatePricingstructure, paramUpdatePricingstructure);


                        console.log(timestamp, " UPDATE t_ticket_event case 11: Pricing Structure");
                        return res.status(200).send({ success: true, message: "Approval updated successfully." });
                    } catch (err) {
                        console.log(timestamp, " UPDATE t_ticket_event case 11 : Pricing Structure error", err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    }

                case 7: // IT tech support
                    let querySetApprovalITSupport =
                        `
                        UPDATE t_ticket_event
                        SET 
                            approve_date = NOW(), 
                            approval_status = 1
                        WHERE 
                            approval_id = ?
                            and
                            approver_id = ?
                    `;

                    let queryUpdateTicketITSupport = `
                        UPDATE t_ticket
                        SET 
                            status_id = 1,
                            last_update = NOW(),
                            assigned_to = ? 
                        WHERE 
                            ticket_id = ?;
                    `;



                    let paramApprovalITSupport = [ticket_id, user_id];
                    let paramUpdateTicketITSupport = [assign_to, ticket_id];

                    try {
                        await dbHots.execute(querySetApprovalITSupport, paramApprovalITSupport);
                        await dbHots.execute(queryUpdateTicketITSupport, paramUpdateTicketITSupport);


                        console.log(timestamp, " UPDATE t_ticket_event case 7: IT Support");
                        return res.status(200).send({ success: true, message: "Approval updated successfully." });
                    } catch (err) {
                        console.log(timestamp, " UPDATE t_ticket_event case 7: IT Support error", err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    }
                case 6: // Sample request form
                    console.log("Access sample request form Approval");

                    // Update approval event
                    let querySetApprovalRequestSRF = `
                        UPDATE t_ticket_event
                        SET 
                            approve_date = NOW(), 
                            approval_status = 1
                        WHERE 
                            approval_id = ?
                        AND
                            approver_id = ? 
                    `;

                    // Query to check for team members
                    const querycheckmembersrf = `
                        SELECT 
                            user_id 
                        FROM 
                            m_team_member mtm
                        WHERE
                            mtm.team_leader = 0
                        AND
                            mtm.team_id = 6
                    `;

                    try {
                        // Retrieve the team member for assignment
                        const [resRowSRF] = await dbHots.promise().query(querycheckmembersrf);

                        if (resRowSRF.length === 0) {
                            return res.status(400).send({ success: false, message: "No team member found to assign." });
                        }

                        // Extract user_id to assign
                        const assignedToUserId = resRowSRF[0].user_id;
                        let paramApprovalRequest = [ticket_id, user_id];

                        // Execute approval update query
                        dbHots.execute(querySetApprovalRequestSRF, paramApprovalRequest, (err, results) => {
                            if (err) {
                                console.log("Error processing querySetApprovalRequestSRF on approval", err);
                                return res.status(500).send({ success: false, message: "Error in approval update." });
                            }



                            // Queries to check total approvals and approved counts
                            let querycheckapproval = `
                                SELECT
                                    COUNT(ae.approval_order) AS Approval_unit
                                FROM
                                    t_ticket_event ae
                                WHERE
                                    ae.approval_id = ?
                            `;

                            let querycheckapproved = `
                                SELECT
                                    COUNT(ae.approval_order) AS Approval_unit
                                FROM
                                    t_ticket_event ae
                                WHERE
                                    ae.approval_id = ?
                                    AND ae.approval_status = 1
                            `;

                            let paramUpdateTicketRequest = [ticket_id];
                            let approvalCount, approvedCount;

                            // Check total approvals count
                            dbHots.execute(querycheckapproval, [ticket_id], (err, results) => {
                                if (err) {
                                    console.log("Error with approval count", err);
                                    return res.status(504).send({ success: false, message: "Error checking approval count" });
                                }
                                approvalCount = results;

                                // Check approved count within the same callback
                                dbHots.execute(querycheckapproved, [ticket_id], (err, results) => {
                                    if (err) {
                                        console.log("Error with approved count", err);
                                        return res.status(505).send({ success: false, message: "Error checking approved count" });
                                    }
                                    approvedCount = results;

                                    console.log("Approval count:", approvalCount);
                                    console.log("Approved count:", approvedCount);

                                    // If all approvals are complete, update ticket status
                                    if (approvalCount[0].Approval_unit === approvedCount[0].Approval_unit) {
                                        console.log("All approvals complete");

                                        let queryUpdateTicketRequest = `
                                            UPDATE t_ticket
                                            SET 
                                                status_id = 1,
                                                assigned_to = ?,
                                                last_update = NOW()
                                            WHERE 
                                                ticket_id = ?;
                                        `;

                                        dbHots.execute(queryUpdateTicketRequest, [assignedToUserId, ...paramUpdateTicketRequest], (err, results) => {
                                            if (err) {
                                                console.log("Error updating ticket status to submitted", err);
                                                return res.status(502).send({
                                                    success: false,
                                                    message: "Error updating ticket status"
                                                });
                                            } else {
                                                console.log("Request successful");
                                                return res.status(200).send({ success: true, message: "Approval and assignment updated successfully." });
                                            }
                                        });
                                    } else {
                                        return res.status(200).send({
                                            success: true,
                                            message: " Approved for this user "
                                        });
                                    }
                                });
                            });
                        });
                    } catch (error) {
                        console.log("Error executing team member query", error);
                        return res.status(500).send({ success: false, message: "Error retrieving team member." });
                    }

                    break;

                case 5:
                    return res.status(400).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 4:
                    return res.status(400).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 3:
                    return res.status(400).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 2:
                    return res.status(400).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 1:
                    console.log("Access IT REQUEST Approval")
                    let querySetApprovalRequest =
                        `
                        UPDATE t_ticket_event
                        SET 
                            approve_date = NOW(), 
                            approval_status = 1
                        WHERE 
                            approval_id = ?
                        AND
                            approver_id = ? 

                        
                    `;

                    let paramApprovalRequest = [ticket_id, user_id];


                    dbHots.execute(querySetApprovalRequest, paramApprovalRequest, (err, results) => {
                        if (err) {
                            console.log("error Processing It Support Approval", err)
                            res.status(500).send({
                                success: false,
                                message: "querySetApprovalRequest must be provided "
                            })
                        } else {

                            let querycheckapproval =
                                `
                                select
                                    COUNT(ae.approval_order) as Aproval_unit
                                from
                                    t_ticket_event ae
                                where
                                    ae.approval_id = ?
                                    
                                `

                            let querycheckapproved =
                                `
                                select
                                    COUNT(ae.approval_order) as Aproval_unit
                                from
                                    t_ticket_event ae
                                where
                                    ae.approval_id = ?
                                    and
                                ae.approval_status = 1
                                `



                            let paramUpdateTicketRequest = [ticket_id];



                            let approvalCount;
                            let approvedCount;

                            dbHots.execute(querycheckapproval, [ticket_id], (err, results) => {
                                if (err) {
                                    console.log("Error with approval count", err);
                                    return res.status(504).send({ success: false, message: "Error checking approval count" });
                                }
                                approvalCount = results;

                                // Second query inside the first callback
                                dbHots.execute(querycheckapproved, [ticket_id], (err, results) => {
                                    if (err) {
                                        console.log("Error with approved count", err);
                                        return res.status(505).send({ success: false, message: "Error checking approved count" });
                                    }
                                    approvedCount = results;
                                    console.log("approvalCount", approvalCount);
                                    console.log("approvedCount", approvedCount);
                                    // Now the check happens when both queries are done
                                    if (approvalCount[0].Aproval_unit === approvedCount[0].Aproval_unit) {
                                        console.log("jalan")

                                        let queryUpdateTicketRequest = `
                                            UPDATE t_ticket
                                            SET 
                                                status_id = 1,
                                                last_update = NOW()
                                            WHERE 
                                                ticket_id = ?;
                                        `;

                                        dbHots.execute(queryUpdateTicketRequest, paramUpdateTicketRequest, (err, results) => {
                                            if (err) {
                                                console.log("Error processing IT Support Approval status to submitted", err);
                                                return res.status(502).send({
                                                    success: false,
                                                    message: "queryUpdateTicketRequest failed"
                                                });
                                            } else {
                                                console.log("Request Success")
                                                return res.status(200).send({ success: true, message: "Approval updated successfully." });
                                            }
                                        });
                                    }
                                });
                            });


                        }

                    })




                    break;

                default:
                    return res.status(500).send({
                        success: false,
                        message: "service_id must be provided "
                    });
            }
        } else {
            res.status(500).send({
                success: false,
                message: "service_id must be provided "
            })
            console.log(timestamp, "setApprove service_id is not provided ")
        }


    }
    ,
    setReject: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id
        let service_id = req.params.service_id
        let ticket_id = req.params.ticket_id
        let rejectionRemark = req.body.rejectionRemark

        let querySetApproval = `
        update
            t_ticket_event
        set
            approve_date = now(),
            approval_status = 2,
            remark = ?
        where
	    approval_id = ?
        and
        approver_id = ?
    `;

        // Second query to update ticket status
        let queryUpdateTicket = `
        UPDATE
        t_ticket
        SET
        status_id = 4
        WHERE
        ticket_id = ?
    `;

        let paramSetApproval = [rejectionRemark, ticket_id, user_id];  // Assuming `approval_id` is the `ticket_id`, adjust if needed
        let paramUpdateTicket = [ticket_id];

        dbHots.execute(querySetApproval, paramSetApproval, (err, results) => {
            if (err) {
                console.log(timestamp, `Set Reject ${ticket_id} 1: approval update error`);
                console.log(timestamp, err);
                return res.status(500).send({
                    success: false,
                    message: err
                });
            } else {
                console.log(timestamp, `Set Reject ${ticket_id} 1: approval updated`);
                // Now execute the second query to update ticket status
                dbHots.execute(queryUpdateTicket, paramUpdateTicket, (err, results) => {
                    if (err) {
                        console.log(timestamp, `Set Reject ${ticket_id} 2: ticket update error`);
                        console.log(timestamp, err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    } else {
                        console.log(timestamp, `Set Reject ${ticket_id} 2: ticket updated`);
                        return res.status(200).send({ data: results });
                    }
                });
            }
        });





    }
    , laptopSpeck: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.user_id) {


            dbHots.query(`
            
                    SELECT
                        *
                    FROM
                        m_laptop_spec ls
                    WHERE
                        NOW() BETWEEN ls.start_date AND COALESCE(ls.end_date, '9999-12-31' );`,
                (err, results) => {

                    if (err) {
                        res.status(500).send({
                            success: false,
                            err
                        })
                    } else {
                        res.status(200).send({
                            success: true,
                            results
                        })
                    }

                })
        } else {
            res.status(401).send({
                success: false,
                message: "unauthorized access"
            })
            console.log(timestamp, " Unauthorized access at HOTS get laptop spec")
        }


    }
    , getAllTiket: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        ///hots_ticket/my_tiket

        const limit = parseInt(req.query.limit, 10) || 10;
        const currentPage = parseInt(req.query.page, 10) || 1;

        const status = req.query.status || "";
        const category = req.query.category || "";
        const searchBarOnTop = req.query.search || "";



        if (req.dataToken.user_id) {

            let queryGetMyTiket = `
            SELECT
                t.ticket_id,
                DATE_FORMAT(t.creation_date, '%d-%b-%Y %H:%i') AS creation_date,
                s.service_id,
                s.service_name,
                s.approval_level,

                -- Assigned name depending on type
                CASE
                    WHEN tta.assigned_type = 'user' THEN CONCAT(u.firstname, ' ', u.lastname)
                    WHEN tta.assigned_type = 'team' THEN tm.team_name
                    WHEN tta.assigned_type = 'department' THEN md.department_name
                    ELSE NULL
                END AS assigned_to,

                JSON_ARRAYAGG(
                JSON_OBJECT(
                    'type', tta.assigned_type,
                    'id', tta.assigned_id,
                    'name', COALESCE(CONCAT(u.firstname, ' ', u.lastname), tm.team_name, md.department_name)
                )
                ) AS assigned_list,

                ts.status_name AS status,
                ts.color,
                t.last_update,
                t.fulfilment_comment,
                COUNT(ae.approve_date) AS approval_status,

                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', a.approver_id,
                            'approval_order', a.approval_order,
                            'approver_name', CONCAT(u2.firstname, ' ', u2.lastname),
                            'approval_status', a.approval_status,
                            'cancel_remark', a.remark
                        )
                    )
                    FROM t_ticket_event a
                    LEFT JOIN user u2 ON u2.user_id = a.approver_id
                    WHERE a.approval_id = t.ticket_id
                ) AS list_approval

            FROM t_ticket t

            LEFT JOIN m_service s ON t.service_id = s.service_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

            -- Conditional joins:
            LEFT JOIN user u ON 
                u.user_id = tta.assigned_id 
                AND tta.assigned_type = 'user'

            LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'

            LEFT JOIN m_department md ON
                md.department_id = tta.assigned_id
                AND tta.assigned_type = 'department'

            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN t_ticket_event ae ON t.ticket_id = ae.approval_id

            WHERE 1 = 1;

            `

            let countQuery = `
            SELECT COUNT(DISTINCT t.ticket_id) AS total_count
                FROM t_ticket t
                LEFT JOIN m_service s 
                    ON s.service_id = t.service_id

                LEFT JOIN t_ticket_assignment tta 
                    ON tta.ticket_id = t.ticket_id
                    AND tta.assignment_status = 'active'

                LEFT JOIN user u 
                    ON (tta.assigned_type = 'user'
                        AND u.user_id = tta.assigned_id)

                LEFT JOIN m_ticket_status ts 
                    ON ts.status_id = t.status_id

                LEFT JOIN m_team tm
                    ON (tta.assigned_type = 'team'
                        AND tm.team_id = tta.assigned_id)

            `;

            if ((status !== "" || status) && status !== "-1") {
                queryGetMyTiket += ` AND t.status_id = ${status} `;
                countQuery += ` AND t.status_id = ${status} `;
            }

            if ((category !== "" || category) && category !== "-1") {
                queryGetMyTiket += ` AND  s.service_id = ${category} `;
                countQuery += ` AND  s.service_id = ${category} `;
            }

            if (searchBarOnTop && searchBarOnTop !== "") {
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%')  ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%')  ) `;
            }

            queryGetMyTiket += `  GROUP BY t.ticket_id, ae.approver_id   `

            queryGetMyTiket += `  ORDER BY t.creation_date DESC  `


            if (limit >= 1) {
                queryGetMyTiket += ` LIMIT ${limit} `;;
                countQuery += ` LIMIT ${limit} `;
            }

            if (currentPage <= 2 || currentPage !== null) {
                queryGetMyTiket += ` OFFSET ${(currentPage - 1) * limit} `;
            }




            dbHots.query(countQuery, (err, results) => {

                if (err) {
                    console.log("countQuery", countQuery)
                    res.status(501).send({
                        success: false,
                        err
                    })

                } else {
                    const totalData = results[0].total_count;
                    const totalPage = Math.ceil(totalData / limit);
                    dbHots.query(queryGetMyTiket, (err1, results1) => {
                        if (err1) {
                            console.log(queryGetMyTiket)
                            res.status(502).send({
                                success: false,
                                err1
                            })
                            console.log(timestamp, "error caught at getAllTicket ", err)
                        } else {


                            res.status(200).send({
                                success: true,
                                totalData,
                                totalPage,
                                data: results1
                            });
                            console.log(timestamp, "successfully getAllTicket  ", req.dataToken.user_id)

                        }
                    })
                }
            })
        } else {
            res.status(500).send({
                success: false,
                message: "UNAUTHORIZED ",

            })
            console.log(timestamp, " getMyTicket Unauthorized ")
        }

    },
    getTaskList_old: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        ///hots_ticket/my_tiket

        const limit = parseInt(req.query.limit, 10) || 10;
        const currentPage = parseInt(req.query.page, 10) || 1;

        const status = req.query.status || "";
        const category = req.query.category || "";
        const searchBarOnTop = req.query.search || "";



        if (req.dataToken.user_id) {
            console.log("user_id", req.dataToken.user_id)
            let queryGetMyTiket = `
            SELECT
                t.ticket_id,
                DATE_FORMAT(t.creation_date, '%d-%b-%Y %H:%i') as creation_date,
                s.service_id,
                s.service_name,
                s.approval_level,
                CONCAT(u.firstname, " ", u.lastname) as assigned_to,
                ts.status_name as status,
                ts.status_id,
                ts.color,
                tm.team_name,
                t.last_update,
                CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
                t.fulfilment_comment,
                (
                    SELECT COUNT(ae.approve_date)
                    FROM t_ticket_event ae
                    WHERE ae.approval_id = t.ticket_id
                ) AS approval_status,
                (
                    SELECT
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'approver_id', a.approver_id, 
                                'approval_order', a.approval_order,
                                'approver_name', CONCAT(u.firstname, " ", u.lastname),
                                'approval_status', a.approval_status,
                                'cancel_remark', a.remark
                            )
                        )
                    FROM
                        t_ticket_event a
                    LEFT JOIN
                        user u ON u.user_id = a.approver_id
                    WHERE
                        a.approval_id = t.ticket_id
                ) AS list_approval
            FROM
                t_ticket t
            LEFT JOIN m_service s ON
                t.service_id = s.service_id
            left join t_ticket_assignment tta on
                t.ticket_id = tta.ticket_id
                and
                    tta.assigned_type = "team"
            left join user u on
                u.user_id = tta.assigned_id
            LEFT JOIN user uc ON
                uc.user_id = t.created_by -- Self-join for created_by user
            LEFT JOIN m_ticket_status ts ON
                ts.status_id = t.status_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

            
            LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
                
           LEFT JOIN m_team_member tmm ON
                tmm.team_id = tm.team_id AND tmm.user_id = ${req.dataToken.user_id}
            LEFT JOIN t_ticket_event ae ON
                t.ticket_id = ae.approval_id AND ae.approver_id = ${req.dataToken.user_id} -- Left join with the approver_id condition
            WHERE
                (
                    ae.approval_id IS NULL -- Case where there are no approval events
                    OR (
                        ae.approval_id IS NOT NULL -- If t_ticket_event exists
                        AND NOT EXISTS (
                            SELECT 1
                            FROM t_ticket_event ae_prev
                            WHERE ae_prev.approval_id = t.ticket_id
                            AND ae_prev.approval_order < ae.approval_order
                            AND ae_prev.approve_date IS NULL
                        )
                    )
                )
            
            `

            let countQuery = `
            SELECT COUNT(DISTINCT t.ticket_id) AS total_count
                FROM t_ticket t
                LEFT JOIN m_service s 
                    ON t.service_id = s.service_id

                LEFT JOIN t_ticket_event ae 
                    ON t.ticket_id = ae.ticket_id

                LEFT JOIN t_ticket_assignment tta 
                    ON t.ticket_id = tta.ticket_id

                LEFT JOIN m_team_member tmm
                    ON tmm.team_id = tta.assigned_id
                    AND tta.assigned_type = 'team'
                    AND tmm.user_id = ${req.dataToken.user_id}

                    

                WHERE 
                (
                    -- 🔥 User is an approver AND all previous orders are completed
                    (
                        ae.actor_id = ${req.dataToken.user_id}
                        AND NOT EXISTS (
                            SELECT 1
                            FROM t_ticket_event ae_prev
                            WHERE ae_prev.ticket_id = t.ticket_id
                            AND ae_prev.approval_order < ae.approval_order
                            AND ae_prev.status = 'pending'
                        )
                    )

                    OR 
                    -- 🔥 User is directly assigned
                    EXISTS (
                        SELECT 1
                        FROM t_ticket_assignment a
                        WHERE a.ticket_id = t.ticket_id
                        AND a.assigned_type = 'user'
                        AND a.assigned_id = ${req.dataToken.user_id}
                        AND a.assignment_status = 'active'
                    )

                    OR
                    -- 🔥 User is team leader of assigned team
                    EXISTS (
                        SELECT 1
                        FROM t_ticket_assignment a
                        JOIN m_team_member m 
                            ON m.team_id = a.assigned_id 
                            AND m.team_leader = 1
                            AND m.user_id = ${req.dataToken.user_id}
                        WHERE a.ticket_id = t.ticket_id
                        AND a.assigned_type = 'team'
                        AND a.assignment_status = 'active'
                    )
                )
            `;

            if ((status !== "" || status) && status !== "-1") {
                queryGetMyTiket += ` AND t.status_id = ${status} `;
                countQuery += ` AND t.status_id = ${status} `;
            }

            if ((category !== "" || category) && category !== "-1") {
                queryGetMyTiket += ` AND  s.service_id = ${category} `;
                countQuery += ` AND  s.service_id = ${category} `;
            }

            if (searchBarOnTop && searchBarOnTop !== "") {
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%')  ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%')  ) `;
            }

            queryGetMyTiket +=
                `
            AND (
                tta.assigned_id = ${req.dataToken.user_id}  -- The current user is assigned to the ticket
                OR ae.approver_id = ${req.dataToken.user_id} -- The current user is an approver for the ticket
                OR tmm.team_leader = 1 -- The current user is a team leader for the ticket
                )
            `

            queryGetMyTiket += `  GROUP BY
            t.ticket_id, s.service_id, s.service_name, u.firstname, u.lastname, ts.status_name, ts.color, tm.team_name, t.last_update, 
            t.fulfilment_comment
            `

            queryGetMyTiket += ` ORDER BY
            t.creation_date DESC
            `

            if (limit >= 1) {
                queryGetMyTiket += ` LIMIT ${limit} `;;
                countQuery += ` LIMIT ${limit} `;
            }

            if (currentPage <= 2 || currentPage !== null) {
                queryGetMyTiket += ` OFFSET ${(currentPage - 1) * limit} `;
            }




            dbHots.query(countQuery, (err, results) => {

                if (err) {
                    console.log("countQuery", countQuery)
                    res.status(501).send({
                        success: false,
                        err
                    })

                } else {

                    const totalData = results[0].total_count;
                    const totalPage = Math.ceil(totalData / limit);
                    dbHots.query(queryGetMyTiket, (err1, results1) => {
                        if (err1) {
                            console.log(queryGetMyTiket)

                            res.status(502).send({
                                success: false,
                                err1
                            })
                            console.log(timestamp, "error caught at getAll-Task ", err1)
                        } else {

                            res.status(200).send({
                                success: true,
                                totalData,
                                totalPage,
                                limit,
                                data: results1
                            });
                            console.log(timestamp, "successfully getAll-Task  ", req.dataToken.user_id)

                        }
                    })
                }
            })
        } else {
            res.status(500).send({
                success: false,
                message: "UNAUTHORIZED ",

            })
            console.log(timestamp, " getMy-Task Unauthorized ")
        }

    },

    getFullFilledTiketCount: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        ///hots_ticket/my_tiket

        if (req.dataToken.user_id) {

            let countQuery = `
            select
            COUNT(*) as total_fullfill
        from
            t_ticket t
        left join m_service s on
            t.service_id = s.service_id
        left join m_ticket_status ts on
            ts.status_id = t.status_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id
         LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
        where
            t.status_id = 2;
            `;


            dbHots.query(countQuery, (err, results) => {
                if (err) {
                    console.error(timestamp, "Error fetching getOpenTiketCount", err);
                    return res.status(500).send({
                        success: false,
                        message: "Internal server error",
                        error: err
                    });
                }

                if (results.length > 0) {
                    const totalData = results[0].total_count;
                    return res.status(200).send({
                        success: true,
                        totalData: totalData
                    });
                } else {
                    return res.status(404).send({
                        success: false,
                        message: "No data found",
                        totalData: 0
                    });
                }
            });


        } else {
            res.status(500).send({
                success: false,
                message: "UNAUTHORIZED ",

            })
            console.log(timestamp, " getMyTicket Unauthorized ")
        }

    }
    , getOpenTiketCount: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        ///hots_ticket/my_tiket

        if (req.dataToken && req.dataToken.user_id) { // Added check for both `req.dataToken` and `user_id`


            let countQuery = `
            select
                    COUNT(*) as total_count
                from
                    t_ticket t
                left join m_service s on
                    t.service_id = s.service_id
                left join m_ticket_status ts on
                    ts.status_id = t.status_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

                 LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
                where
                    t.status_id IN (0, 1, 5);
            `;


            dbHots.query(countQuery, (err, results) => {
                if (err) {
                    console.error(timestamp, "Error fetching getOpenTiketCount", err);
                    return res.status(500).send({
                        success: false,
                        message: "Internal server error",
                        error: err
                    });
                }

                if (results.length > 0) {
                    const totalData = results[0].total_count;
                    return res.status(200).send({
                        success: true,
                        totalData: totalData
                    });
                } else {
                    return res.status(404).send({
                        success: false,
                        message: "No data found",
                        totalData: 0
                    });
                }
            });

        } else {
            res.status(500).send({
                success: false,
                message: "UNAUTHORIZED ",

            })
            console.log(timestamp, " getMyTicket Unauthorized ")
        }

    },
    getRejectTiketCount: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';

        if (req.dataToken && req.dataToken.user_id) { // Added check for both `req.dataToken` and `user_id`

            let countQuery = `
                SELECT COUNT(*) AS total_count
                FROM t_ticket t
                LEFT JOIN m_service s ON t.service_id = s.service_id
                LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

 LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'

                WHERE t.status_id = 4;
            `;

            dbHots.query(countQuery, (err, results) => {
                if (err) {
                    console.error(timestamp, "Error fetching rejected tickets count", err);
                    return res.status(500).send({
                        success: false,
                        message: "Internal server error",
                        error: err
                    });
                }

                if (results.length > 0) {
                    const totalData = results[0].total_count;
                    return res.status(200).send({
                        success: true,
                        totalData: totalData
                    });
                } else {
                    return res.status(404).send({
                        success: false,
                        message: "No data found",
                        totalData: 0

                    });
                }
            });

        } else {
            console.warn(timestamp, "getRejectTiketCount Unauthorized");
            return res.status(401).send({
                success: false,
                message: "Unauthorized access"
            });
        }
    },
    getTicketComment: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
        let ticket_id = req.params.ticket_id;

        let user_id = req.dataToken.user_id
        if (req.dataToken && req.dataToken.user_id) {




            if (ticket_id) {



                let commentQuery =

                    `
                    select
                        c.comment_id,
                        c.user_id as sender_id,
                        c.comment as text,
                        c.status,
                        DATE_FORMAT(c.date_created, '%W, ') as day_created,
                        DATE_FORMAT(c.date_created,'%d-%b-%Y ') as date_created,
                        DATE_FORMAT(c.date_created, '%H:%i') as time_created,
                        a.attachment_id,
                        a.url as attachment_url,
                        CONCAT(u.firstname, " ", u.lastname) as sender
                    from
                        t_comment c
                    left join 
                        t_attachment a on
                        c.ticket_id = a.ticket_id 
                    and
                        c.comment_id = a.comment_id
                    left join
                        user u on
                        u.user_id = c.user_id
                    where
                        c.ticket_id = ?
                    order by
                        c.date_created
                        `
                let countquery =
                    `
                SELECT COUNT(comment_id) cnt FROM t_comment WHERE ticket_id = ?
                
                `

                dbHots.query(countquery, [ticket_id], (err, results) => {

                    if (err) {
                        console.error(timestamp, "Error fetching getOpenTiketCount", err);
                        return res.status(500).send({
                            success: false,
                            message: "Internal server error",
                            error: err
                        });
                    } else {

                        const count = results[0].cnt;

                        dbHots.query(commentQuery, [ticket_id, ticket_id], (err, results) => {

                            if (err) {
                                console.error(timestamp, "Error fetching getOpenTiketCount", err);
                                return res.status(500).send({
                                    success: false,
                                    message: "Internal server error",
                                    error: err
                                });
                            }
                            const list = results;
                            if (results.length > 0) {

                                return res.status(200).send({
                                    success: true,
                                    comment_list: list,  // Return the comment list
                                    comment_count: count  // Return the comment count
                                });
                            } else {
                                console.log(timestamp, `getTicketComment success with empty list for ID ${ticket_id}`);

                                return res.status(200).send({
                                    success: false,
                                    message: "No data found",
                                    totalData: 0
                                });
                            }
                        })

                    }




                })




            }
            else {
                console.warn(timestamp, "getRejectTiketCount Unauthorized");
                return res.status(404).send({
                    success: false,
                    message: "404 error no data with that ticket ID"
                });
            }





        } else {
            console.warn(timestamp, "getRejectTiketCount Unauthorized");
            return res.status(401).send({
                success: false,
                message: "Unauthorized access"
            });
        }

    },
    getTicketEmail: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
        let ticket_id = req.params.ticket_id;

        let user_id = req.dataToken.user_id
        if (req.dataToken && req.dataToken.user_id) {

            if (ticket_id) {

                let emailQuery =

                    `
                    select
                        *
                    from
                        t_srf_mail c
                    where
                        c.ticket_id = ?
                    
                    `

                dbHots.query(emailQuery, [ticket_id], (err, results) => {

                    if (err) {
                        console.error(timestamp, "Error fetching getTicketEmail", err);
                        return res.status(500).send({
                            success: false,
                            message: "Internal server error",
                            error: err
                        });
                    }
                    const list = results;
                    if (results.length > 0) {
                        console.log(timestamp, `getTicketEmail success for ID ${ticket_id}`);

                        return res.status(200).send({
                            success: true,
                            data: list,  // Return the comment list
                        });
                    } else {
                        console.log(timestamp, `getTicketEmail failed with empty list for ID ${ticket_id}`);

                        return res.status(200).send({
                            success: true,
                            message: "No data found",
                            totalData: 0
                        });
                    }
                })

            }
            else {
                console.warn(timestamp, "getRejectTiketCount Unauthorized");
                return res.status(404).send({
                    success: false,
                    message: "404 error no data with that ticket ID"
                });
            }





        } else {
            console.warn(timestamp, "getRejectTiketCount Unauthorized");
            return res.status(401).send({
                success: false,
                message: "Unauthorized access"
            });
        }

    },
    setTicketEmail: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
        let ticket_id = req.params.ticket_id;
        const { email, emailtype } = req.body;

        let user_id = req.dataToken.user_id
        if (req.dataToken && req.dataToken.user_id) {

            if (ticket_id) {

                let emailQuery =

                    `
                        INSERT INTO t_srf_mail
                        ( email, email_type, ticket_id)
                        VALUES
                        (?, ?, ?);
                        `

                dbHots.query(emailQuery, [email, emailtype, ticket_id], (err, results) => {

                    if (err) {
                        console.error(timestamp, "Error fetching setTicketEmail", err);
                        return res.status(500).send({
                            success: false,
                            message: "Internal server error",
                            error: err
                        });
                    }
                    else {
                        console.log(timestamp, `setTicketEmail success ID ${ticket_id}`);
                        return res.status(200).send({
                            success: true,
                        });
                    }
                })

            }
            else {
                console.warn(timestamp, "getRejectTiketCount Unauthorized");
                return res.status(404).send({
                    success: false,
                    message: "404 error no data with that ticket ID"
                });
            }





        } else {
            console.warn(timestamp, "getRejectTiketCount Unauthorized");
            return res.status(401).send({
                success: false,
                message: "Unauthorized access"
            });
        }

    },
    delTicketEmail: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
        const { ticket_id } = req.params;  // Extract ticket_id from URL parameter
        const { email_id } = req.query;

        let user_id = req.dataToken.user_id
        if (req.dataToken && req.dataToken.user_id) {

            if (ticket_id) {

                let emailQuery =

                    `
                        DELETE FROM t_srf_mail
                        WHERE 
                        email_id = ? ;
                        `

                dbHots.query(emailQuery, [email_id], (err, results) => {

                    if (err) {
                        console.error(timestamp, "Error fetching delTicketEmail", err);
                        return res.status(500).send({
                            success: false,
                            message: "Internal server error",
                            error: err
                        });
                    }
                    else {
                        console.log(timestamp, `delTicketEmail success for ID ${ticket_id} and email ${email_id}`);

                        return res.status(200).send({
                            success: true,
                        });
                    }
                })

            }
            else {
                console.warn(timestamp, "getRejectTiketCount Unauthorized");
                return res.status(404).send({
                    success: false,
                    message: "404 error no data with that ticket ID"
                });
            }





        } else {
            console.warn(timestamp, "getRejectTiketCount Unauthorized");
            return res.status(401).send({
                success: false,
                message: "Unauthorized access"
            });
        }

    },
    setTicketComment: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';
        let ticket_id = req.params.ticket_id;

        let comment = req.body.comment;
        let file = req.body.file;
        let user_id = req.dataToken.user_id;
        if (req.dataToken && req.dataToken.user_id) {

            if (ticket_id) {


                let commentCount =
                    `
                    select
                        COUNT(*) as comment_count
                    from
                        t_comment c
                    where
                        c.ticket_id = ?
                    `
                dbHots.query(commentCount, [ticket_id], (err, results) => {

                    if (err) {
                        console.error(timestamp, "Error Creating setOpenTiketCount", err);
                        return res.status(501).send({
                            success: false,
                            message: "Internal server error",
                            error: err
                        });
                    } else {

                        let ticket_order = results[0].comment_count + 1

                        let commentQuery =

                            `
    
                        INSERT 
                        INTO 
                        t_comment
                        ( comment_id, ticket_id, user_id, comment, date_created)
                        VALUES
                        ( ?, ?, ?, ?, NOW() );          
                                        
                          `



                        dbHots.query(commentQuery, [ticket_order, ticket_id, user_id, comment], (err, results) => {

                            if (err) {
                                console.error(timestamp, "Error Creating setOpenTiketCount", err);
                                return res.status(500).send({
                                    success: false,
                                    message: "Internal server error",
                                    error: err
                                });
                            } else {

                                if (req.files && req.files.length > 0) {
                                    let queryInsertFiles = `
                                        INSERT INTO 
                                        t_attachment (ticket_id, url, comment_id) 
                                        VALUES (?, ?, ?)
                                    `;

                                    // Iterate over the files and insert them one by one
                                    for (let file of req.files) {
                                        let file_url = `/public/files/hots/it_support/${file.filename}`;

                                        dbHots.query(queryInsertFiles, [ticket_id, file_url, ticket_order], (err, results) => {
                                            if (err) {
                                                console.error(timestamp, "Error inserting attachment", err);
                                                return res.status(500).send({
                                                    success: false,
                                                    message: "Internal server error",
                                                    error: err
                                                });
                                            }
                                        });
                                    }


                                    return res.status(200).send({
                                        success: true,
                                        message: "Comment and files added successfully"
                                    });

                                } else {
                                    console.log(timestamp, "No files uploaded");
                                    return res.status(200).send({
                                        success: true,
                                        message: "Comment added successfully without files"
                                    });
                                }


                            }
                        })


                    }
                })





            } else {
                console.warn(timestamp, "Creating setOpenTiketCount Unauthorized");
                return res.status(404).send({
                    success: false,
                    message: "404 error no data with that ticket ID"
                });
            }




        } else {
            console.warn(timestamp, "Creating setOpenTiketCount Unauthorized");
            return res.status(401).send({
                success: false,
                message: "Unauthorized access"
            });
        }

    }
    ,
    setStatusChange: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';

        let ticket_id = req.params.ticket_id;
        let fullfillment_comment = req.body.fullfillment_comment;
        let status = req.body.ticket_status;

        // Check for required parameters
        if (!ticket_id) {
            return res.status(400).send({ success: false, message: 'ticket_id and ticket_status are required.' });
        }

        let querySetApproval = `
            UPDATE t_ticket
            SET status_id = ?,
                last_update = NOW()`;

        if (fullfillment_comment) {
            querySetApproval += `
                , fulfilment_comment = ?`;
        }

        querySetApproval += `
            WHERE ticket_id = ?`;

        // Prepare the parameters for the query
        let paramSetApproval = [status];  // Start with status

        if (fullfillment_comment) {
            paramSetApproval.push(fullfillment_comment);
        }

        paramSetApproval.push(ticket_id); // Always push ticket_id at the end

        // Execute the query
        dbHots.execute(querySetApproval, paramSetApproval, (err, results) => {
            if (err) {
                console.log(timestamp, `Set Reject ${ticket_id} 1: approval update error`);
                console.log(timestamp, err);
                return res.status(500).send({
                    success: false,
                    message: err
                });
            } else {
                console.log(timestamp, `Set Reject ${ticket_id} 2: ticket updated`);
                return res.status(200).send({ message: "success" });
            }
        });
    },

    setAssignToChange: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';

        let ticket_id = req.params.ticket_id;
        let assigned_to = req.body.assigned_to;

        // Check for required parameters
        if (!ticket_id) {
            return res.status(400).send({ success: false, message: 'ticket_id and assigned_to are required.' });
        }

        // SQL query to update the assigned_to field
        let querySetApproval = `
            UPDATE t_ticket
            SET assigned_to = ?,
                last_update = NOW()
            WHERE ticket_id = ?`;

        // Prepare the parameters for the query
        let paramSetApproval = [assigned_to, ticket_id]; // Both must be defined

        // Execute the query
        dbHots.execute(querySetApproval, paramSetApproval, (err, results) => {
            if (err) {
                console.log(timestamp, `Set Assign ${ticket_id} 1: update error`);
                console.log(timestamp, err);
                return res.status(500).send({
                    success: false,
                    message: err
                });
            } else {
                console.log(timestamp, `Set Assign ${ticket_id} 2: ticket updated`);
                return res.status(200).send({ message: "success" });
            }
        });
    },

    setTicketChange: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';

        let ticket_id = req.params.ticket_id;
        let status = req.body.ticket_status;
        let fullfillment_comment = req.body.fullfillment_comment;
        let assigned_to = req.body.assigned_to;

        console.log(ticket_id + "][" + status + "][" + fullfillment_comment + "][" + assigned_to)

        // Check for required parameters
        if (!ticket_id) {
            return res.status(400).send({ success: false, message: 'ticket_id and ticket_status are required.' });
        }

        let queryUpdateStatus = `
            UPDATE t_ticket
            SET status_id = ?,
                last_update = NOW()`;

        if (fullfillment_comment) {
            queryUpdateStatus += `
                , fulfilment_comment = ?`;
        }

        queryUpdateStatus += `
            WHERE ticket_id = ?`;

        // Prepare the parameters for the query
        let paramUpdateStatus = [status];  // Start with status

        if (fullfillment_comment) {
            paramUpdateStatus.push(fullfillment_comment);
        }

        paramUpdateStatus.push(ticket_id); // Always push ticket_id at the end

        // Execute the query
        dbHots.execute(queryUpdateStatus, paramUpdateStatus, (err, results) => {
            if (err) {
                console.log(timestamp, `paramUpdateStatus  ${ticket_id} : status update error`);
                console.log(timestamp, err);
                return res.status(500).send({
                    success: false,
                    message: err
                });
            } else {

                let querySetAssign = `
                UPDATE t_ticket
                SET assigned_to = ?,
                    last_update = NOW()
                WHERE ticket_id = ?`;

                // Prepare the parameters for the query
                let paramSetAssign = [assigned_to, ticket_id]; // Both must be defin

                dbHots.execute(querySetAssign, paramSetAssign, (err, results) => {
                    if (err) {
                        console.log(timestamp, `Set Assign ${ticket_id} 1: update error`);
                        console.log(timestamp, err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    } else {

                        if (fullfillment_comment) {

                            let commentCount =
                                `
                            select
                                COUNT(*) as comment_count
                            from
                                t_comment c
                            where
                                c.ticket_id = ?
                            `
                            dbHots.query(commentCount, [ticket_id], (err, results) => {

                                if (err) {
                                    console.error(timestamp, "Error Creating setOpenTiketCount", err);
                                    return res.status(501).send({
                                        success: false,
                                        message: "Internal server error",
                                        error: err
                                    });
                                } else {

                                    let ticket_order = results[0].comment_count + 1

                                    let commentQuery =

                                        `
            
                                INSERT 
                                INTO 
                                t_comment
                                ( comment_id, ticket_id, user_id, comment, date_created, status)
                                VALUES
                                ( ?, ?, "999999", ?, NOW(), ? );          
                                                
                                  `



                                    dbHots.query(commentQuery, [ticket_order, ticket_id, fullfillment_comment || " ticked ended by system", status], (err, results) => {
                                        if (err) {
                                            console.error(timestamp, "Error Creating setOpenTiketCount", err);
                                            return res.status(500).send({
                                                success: false,
                                                message: "Internal server error",
                                                error: err
                                            });
                                        } else {
                                            console.log(timestamp, `paramUpdateStatus  ${ticket_id} : status updated`);
                                            return res.status(200).send({ message: "success" });
                                        }
                                    }
                                    )

                                }
                            }
                            )

                        } else {
                            console.log(timestamp, `paramUpdateStatus  ${ticket_id} : status updated`);
                            return res.status(200).send({ message: "success" });

                        }




                    }
                });



            }
        });
    },


    createTicketWithDetails: async (serviceId, userId, assignedTeam, assignedTo, reason, formData) => {
        return new Promise((resolve, reject) => {
            const insertTicketQuery = `
                INSERT INTO t_ticket (
                    service_id, status_id, created_by, assigned_team, assigned_to,
                    creation_date, last_update, reason
                ) VALUES (?, 1, ?, ?, ?, NOW(), NOW(), ?)
            `;

            dbHots.execute(insertTicketQuery, [
                serviceId, userId, assignedTeam, assignedTo, reason
            ], (err, ticketResult) => {
                if (err) {
                    reject(err);
                    return;
                }

                const ticketId = ticketResult.insertId;

                // Create ticket details
                const detailColumns = [];
                const detailValues = [ticketId];
                const detailPlaceholders = ['?'];

                for (let i = 1; i <= 16; i++) {
                    const cstmCol = `cstm_col${i}`;
                    const lblCol = `lbl_col${i}`;

                    detailColumns.push(cstmCol, lblCol);
                    detailValues.push(formData[cstmCol] || '', formData[lblCol] || '');
                    detailPlaceholders.push('?', '?');
                }

                const insertDetailQuery = `
                    INSERT INTO t_ticket_detail (
                        ticket_id, ${detailColumns.join(', ')}
                    ) VALUES (${detailPlaceholders.join(', ')})
                `;

                dbHots.execute(insertDetailQuery, detailValues, (err2) => {
                    if (err2) {
                        reject(err2);
                        return;
                    }

                    resolve(ticketId);
                });
            });
        });
    },

    // Handle file uploads for ticket
    handleTicketFileUploads: async (ticketId, uploadIds) => {
        if (!uploadIds || uploadIds.length === 0) return;

        return new Promise((resolve, reject) => {
            const updateFilesQuery = `
                UPDATE t_temp_upload 
                SET is_used = TRUE, ticket_id = ?
                WHERE upload_id IN (${uploadIds.map(() => '?').join(',')})
            `;

            dbHots.execute(updateFilesQuery, [ticketId, ...uploadIds], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    },

    getServiceWithWorkflow: async (serviceId) => {
        return new Promise((resolve, reject) => {
            const serviceQuery = `
                SELECT s.*, wg.workflow_group_id
                FROM m_service s
                LEFT JOIN m_workflow_groups wg ON wg.workflow_group_id = s.m_workflow_groups
                WHERE s.service_id = ?
            `;

            dbHots.execute(serviceQuery, [serviceId], (err, serviceResult) => {
                if (err || !serviceResult.length) {
                    reject(err || new Error('Service not found'));
                    return;
                }

                const service = serviceResult[0];

                const workflowQuery = `
                    SELECT ws.*, u.firstname, u.lastname, t.team_name
                    FROM m_workflow_step ws
                    LEFT JOIN user u ON u.user_id = ws.assigned_user_id
                    LEFT JOIN m_team t ON t.team_id = ws.assigned_team_id
                    WHERE ws.workflow_group_id = ?
                    ORDER BY ws.step_order
                `;

                dbHots.execute(workflowQuery, [service.workflow_group_id], (err2, workflowSteps) => {
                    if (err2) {
                        reject(err2);
                        return;
                    }

                    resolve({
                        service,
                        workflowSteps
                    });
                });
            });
        });
    },

    getTicketsWithPagination: async (baseQuery, countQuery, params, limit, offset) => {
        return new Promise((resolve, reject) => {
            // Get total count first
            dbHots.execute(countQuery, params.slice(0, -2), (err, countResult) => {
                if (err) {
                    reject(err);
                    return;
                }

                const totalData = countResult[0].total;
                const totalPage = Math.ceil(totalData / limit);

                // Get paginated data
                dbHots.execute(baseQuery, params, (err2, results) => {
                    if (err2) {
                        reject(err2);
                        return;
                    }

                    resolve({
                        totalData,
                        totalPage,
                        data: results
                    });
                });
            });
        });
    },


    // executeCustomFunction: async (ticketId, functionData, variables) => {

    //     console.log("ticketId", ticketId)
    //     console.log("functionData", functionData)
    //     console.log("variables", variables)
    //     return new Promise((resolve, reject) => {
    //         const logQuery = `
    //         INSERT INTO t_custom_function_logs (
    //             ticket_id, service_id, function_name, trigger_event, status, 
    //             result_data, error_message, execution_time, created_by
    //         ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    //     `;

    //         const inputData = JSON.stringify({
    //             variables: variables,
    //             template_id: functionData.template_id,
    //             document_type: functionData.document_type,
    //             output_format: functionData.output_format,
    //             template_content: functionData.template_content,
    //             file_name_pattern: functionData.file_name_pattern
    //         });

    //         const params = [
    //             ticketId,
    //             variables.service_id || null, // Tambahkan di functionData jika belum ada
    //             functionData.name,
    //             "on_created",
    //             "pending",
    //             inputData,
    //             null, // error_message (null dulu)

    //             variables.created_by || 0 // atau gunakan user_id jika tersedia
    //         ];


    //         dbHots.execute(logQuery, params, (err, result) => {
    //             if (err) {
    //                 console.error('Error executing custom function:', err);
    //                 reject(err);
    //             } else {
    //                 console.log(`Custom function ${functionData.function_id} executed for ticket ${ticketId}`);
    //                 resolve(result);
    //             }
    //         });
    //     });
    // },


    executeCustomFunction: async (reqOrTicketId, functionDataOrFunctionId, variablesOrParams, mode = 'auto') => {
        try {
            const isManual = mode === 'manual';
            const ticket_id = isManual ? reqOrTicketId.body.ticket_id : reqOrTicketId;
            const functionId = isManual ? reqOrTicketId.params.functionId : functionDataOrFunctionId.function_id;
            const params = isManual ? reqOrTicketId.body.params || {} : variablesOrParams;
            const userId = isManual ? reqOrTicketId.dataToken.user_id : (variablesOrParams.created_by || 0);

            const inputData = JSON.stringify({
                variables: variablesOrParams,
                template_id: functionDataOrFunctionId.template_id,
                document_type: functionDataOrFunctionId.document_type,
                output_format: functionDataOrFunctionId.output_format,
                template_content: functionDataOrFunctionId.template_content,
                file_name_pattern: functionDataOrFunctionId.file_name_pattern
            });

            console.log(`Executing custom function: ${functionId} for ticket: ${ticket_id}`);

            // Get function details
            const [functionDetails] = await dbHots.promise().query(
                'SELECT * FROM m_custom_functions WHERE id = ? AND is_active = 1',
                [functionId]
            );


            if (functionDetails.length === 0) {
                if (isManual) {
                    return reqOrTicketId.res.status(404).json({
                        success: false,
                        message: 'Custom function not found'
                    });
                } else {
                    throw new Error('Custom function not found');
                }
            }

            const func = functionDetails[0];

            let result = {};
            let status = 'success';
            let errorMessage = null;

            try {
                // Execute function based on type
                switch (func.type) {
                    case 'document_generation':
                        console.log("document_generation")
                        result = await hotscustomfunctionController.executeDocumentGeneration(func, ticket_id, params);
                        break;
                    case 'excel_processing':
                        result = await hotscustomfunctionController.executeExcelProcessing(func, ticket_id, params);
                        console.log("excel_processing")
                        break;
                    case 'email_notification':
                        result = await hotscustomfunctionController.executeEmailNotification(func, ticket_id, params);
                        console.log("email_notification")
                        break;
                    case 'api_integration':
                        result = await hotscustomfunctionController.executeApiIntegration(func, ticket_id, params);
                        console.log("api_integration")
                        break;
                    default:
                        result = await hotscustomfunctionController.executeCustomHandler(func, ticket_id, params);
                        console.log("default")
                }
            } catch (execError) {
                status = 'failed';
                errorMessage = execError.message;
                result = { error: execError.message };
                console.log('Function execution error: ' + execError.message);
            }

            // Log function execution
            await dbHots.promise().query(`
            INSERT INTO t_custom_function_logs 
            (ticket_id, service_id, function_name, trigger_event, status, result_data, error_message, execution_time, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
          `, [
                ticket_id,
                func.service_id || 0,
                func.name,
                isManual ? 'manual' : 'on_created',
                status,
                JSON.stringify(result),
                errorMessage,
                userId
            ]);

            console.log(`Function execution completed with status: ${status}`);

            if (isManual) {
                return reqOrTicketId.res.json({
                    success: status === 'success',
                    message: status === 'success' ? 'Function executed successfully' : 'Function execution failed',
                    data: result
                });
            } else {
                return { success: status === 'success', result };
            }
        } catch (error) {
            console.log('Error executing custom function: ' + error.message);

            if (mode === 'manual') {
                return reqOrTicketId.res.status(500).json({
                    success: false,
                    message: 'Failed to execute custom function',
                    error: error.message
                });
            } else {
                throw error;
            }
        }
    },


    // Execute custom functions for ticket
    callexecuteCustomFunctions: async (serviceId, ticketId) => {
        return new Promise((resolve, reject) => {
            const customFunctionQuery = `
            SELECT cf.*, csa.trigger_event, csa.execution_order
            FROM m_custom_functions cf
            INNER JOIN t_service_custom_functions csa ON cf.id = csa.function_id
            WHERE csa.service_id = ? AND csa.trigger_event = 'on_created' AND csa.is_active = 1
            ORDER BY csa.execution_order
        `;

            dbHots.execute(customFunctionQuery, [serviceId], (err, customFunctions) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!customFunctions || customFunctions.length === 0) {
                    resolve();
                    return;
                }

                // Get complete ticket data for function execution
                const getTicketDataQuery = `
                SELECT 
                    t.ticket_id, t.service_id, s.service_name, t.created_by,
                    CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                    tm.team_name, d.department_name,
                    td.*
                FROM t_ticket t
                LEFT JOIN m_service s ON s.service_id = t.service_id
                LEFT JOIN user u ON u.user_id = t.created_by

            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

  LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
               
            
                LEFT JOIN m_department d ON d.department_id = u.department_id
                LEFT JOIN t_ticket_detail td ON td.ticket_id = t.ticket_id
                WHERE t.ticket_id = ?
            `;

                dbHots.execute(getTicketDataQuery, [ticketId], async (err2, ticketData) => {
                    if (err2) {
                        console.log("error2")
                        reject(err2);
                        return;
                    }

                    if (!ticketData || ticketData.length === 0) {
                        console.log("no data")
                        resolve();
                        return;
                    }

                    const ticket = ticketData[0];

                    try {
                        // Execute each custom function
                        for (const customFunction of customFunctions) {


                            const functionData = {
                                function_id: customFunction.id,
                                name: customFunction.name,
                                type: customFunction.type,
                                handler: customFunction.handler,
                                config: customFunction.config,
                                template_id: customFunction.config.template_id,
                                document_type: customFunction.config.document_type,
                                output_format: customFunction.config.output_format,
                                template_content: customFunction.config.template_content,
                                file_name_pattern: customFunction.config.file_name_pattern
                            };

                            // Map ticket data to template variables
                            const variables = module.exports.mapTicketDataToVariables(ticket, ticket);
                            // Execute the custom function
                            await module.exports.executeCustomFunction(
                                ticketId,
                                functionData,
                                variables
                            );
                        }
                        resolve();
                    } catch (funcError) {
                        reject(funcError);
                    }
                });
            });
        });
    },


    // Map ticket data to template variables for Sample Request Form



    // 1. FIXED Create Ticket (with file handling)
    // Create New Ticket - Updated with superior assignment logic
    createTicket: async (req, res) => {
        let date = new Date();
        let timestamp = "\x1b[33m" + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let user_name = req.dataToken.firstname;
        let service_id = req.params.service_id;
        let { upload_ids, ...formData } = req.body;

        const mailAddress = await dbQueryHots(`SELECT email  FROM USER WHERE user_id = ${req.dataToken.user_id}`);

        if (!service_id) {
            return res.status(400).send({
                success: false,
                message: "service_id and reason are required"
            });
        }

        const fullJsonText = JSON.stringify(req.body, null, 2);
        // console.log("req.body for tickets (full JSON):\n", fullJsonText);
        // console.log("=================================================================");

        try {
            // Get service details
            const [serviceResult] = await dbHots.promise().execute(`
                SELECT s.*, wg.id
                FROM m_service s
                LEFT JOIN m_workflow_groups wg ON wg.id = s.m_workflow_groups
                WHERE s.service_id = ?
            `, [service_id]);

            if (!serviceResult.length) {
                console.log(timestamp, "GET SERVICE ERROR: Not found");
                return res.status(502).send({ success: false, message: "Service not found" });
            }

            const service = serviceResult[0];
            const assigned_team = service?.team_id || null;

            // Get workflow steps
            const [workflowSteps] = await dbHots.promise().execute(`
                SELECT ws.step_order, ws.step_type, ws.assigned_value
                FROM t_workflow_step ws
                WHERE ws.workflow_group_id = ? AND ws.is_active = 1
                ORDER BY ws.step_order
            `, [service.m_workflow_groups]);

            // Insert ticket
            let assigned_to = null;
            let current_step = workflowSteps.length > 0 ? 1 : 0;
            if (workflowSteps.length === 0) {
                assigned_to = user_id;
            } else if (!assigned_team) {
                assigned_to = user_id;
            }

            const ticket_id = await generateCustomTicketID(dbHots, service_id, user_id);

            // 🧾 Log generated ID
            console.log(timestamp, yellowTerminal, `Generated Ticket ID: ${ticket_id}`);

            // 🪄 Insert with custom ticket_id
            await dbHots.promise().execute(`
                INSERT INTO t_ticket (
                    ticket_id, service_id, status_id, created_by, assigned_team, assigned_to,
                    creation_date, last_update, current_step
                ) VALUES (?, ?, 1, ?, ?, ?, NOW(), NOW(), ?)
            `, [ticket_id, service_id, user_id, assigned_team, assigned_to, current_step]);
            // Insert ticket detail
            const detailInsertPromises = [];
            let orderCounter = 0;

            const entries = Object.entries(formData)
                .filter(([key]) => !isNaN(Number(key))) // only numbered keys
                .sort(([a], [b]) => Number(a) - Number(b));

            for (const [index, item] of entries) {
                const { type, label, value, rows, combinedMapping, fields } = item;



                if (type === "section" && Array.isArray(fields)) {
                    for (const field of fields) {
                        const fieldName = field.name || field.label || "Unnamed Field";
                        const fieldValue = field.value ?? "";

                        if (fieldValue !== "" && fieldValue !== undefined && fieldValue !== null) {
                            detailInsertPromises.push(
                                dbHots.promise().execute(
                                    `INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, order_col)
                             VALUES (?, ?, ?, ?)`,
                                    [ticket_id, fieldValue, fieldName, orderCounter]
                                )
                            );
                            orderCounter++;
                        }
                    }
                    continue;
                }

                // --- Handle normal fields ---
                if (type !== "rowgroup") {
                    if (value !== "" && value !== undefined && value !== null) {
                        detailInsertPromises.push(
                            dbHots.promise().execute(
                                `INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, order_col)
             VALUES (?, ?, ?, ?)`,
                                [ticket_id, value, label, orderCounter]
                            )
                        );
                        orderCounter++;
                    }
                    continue;
                }

                // --- Handle Rowgroup ---
                if (type === "rowgroup" && Array.isArray(rows)) {
                    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                        const row = rows[rowIndex];

                        // Define labels for clarity
                        const colLabels = {
                            firstValue: "Item Name",
                            secondValue: "Quantity",
                            thirdValue: "Unit",
                        };

                        // 🔹 Combined mapping parts (e.g., ['second','third'])
                        const combinedParts = combinedMapping ? combinedMapping.split("_") : [];

                        // 🔹 Step 1: Insert uncombined columns (those NOT in combinedParts)
                        const uncombinedCols = Object.keys(colLabels).filter(
                            (key) => !combinedParts.includes(key.replace("Value", ""))
                        );

                        for (const colKey of uncombinedCols) {
                            const val = row[colKey];
                            if (val) {
                                detailInsertPromises.push(
                                    dbHots.promise().execute(
                                        `INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, order_col)
                               VALUES (?, ?, ?, ?)`,
                                        [ticket_id, val, colLabels[colKey], orderCounter]
                                    )
                                );
                                orderCounter++;
                            }
                        }

                        // 🔹 Step 2: Insert combined value (if defined)
                        if (combinedParts.length > 0) {
                            const combinedValues = combinedParts
                                .map((p) => row[`${p}Value`])
                                .filter(Boolean);
                            const combinedLabels = combinedParts
                                .map((p) => colLabels[`${p}Value`])
                                .filter(Boolean);

                            if (combinedValues.length > 0) {
                                const combinedVal = combinedValues.join(" ");
                                const combinedLabel = combinedLabels.join(" / ");
                                detailInsertPromises.push(
                                    dbHots.promise().execute(
                                        `INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, order_col)
                               VALUES (?, ?, ?, ?)`,
                                        [ticket_id, combinedVal, combinedLabel, orderCounter]
                                    )
                                );
                                orderCounter++;
                            }
                        }
                    }
                }
            }


            await Promise.all(detailInsertPromises);



            // Approval events
            let approvalPromises = [];
            for (const step of workflowSteps) {
                if (step.step_type === 'user' || step.step_type === 'specific_user') {
                    approvalPromises.push(dbHots.promise().execute(`
                        INSERT INTO t_ticket_event (
                            approval_id, approver_id, approval_order, approval_status,
                            step_type, assigned_value, approver_leader
                        ) VALUES (?, ?, ?, 0, 'user', ?, 1)
                    `, [ticket_id, step.assigned_value, step.step_order, step.assigned_value]));

                } else if (step.step_type === 'team') {
                    const [teamMembers] = await dbHots.promise().execute(
                        `SELECT user_id, team_leader FROM m_team_member WHERE team_id = ?`,
                        [step.assigned_value]
                    );

                    for (const member of teamMembers) {
                        approvalPromises.push(dbHots.promise().execute(`
                            INSERT INTO t_ticket_event (
                                approval_id, approver_id, approval_order, approval_status,
                                step_type, assigned_value, approver_leader
                            ) VALUES (?, ?, ?, 0, 'team', ?, ?)
                        `, [ticket_id, member.user_id, step.step_order, step.assigned_value, member.team_leader]));
                    }

                } else if (step.step_type === 'role') {
                    const [roleUsers] = await dbHots.promise().execute(
                        `SELECT user_id FROM user WHERE role_id = ? AND active = 1`,
                        [step.assigned_value]
                    );

                    for (const user of roleUsers) {
                        approvalPromises.push(dbHots.promise().execute(`
                            INSERT INTO t_ticket_event (
                                approval_id, approver_id, approval_order, approval_status,
                                step_type, assigned_value, approver_leader
                            ) VALUES (?, ?, ?, 0, 'role', ?, 1)
                        `, [ticket_id, user.user_id, step.step_order, step.assigned_value]));
                    }

                } else if (step.step_type === 'superior') {
                    const [[{ superior_id } = {}]] = await dbHots.promise().execute(
                        `SELECT superior_id FROM user WHERE user_id = ?`,
                        [user_id]
                    );

                    let approverId = superior_id;
                    if (!approverId) {
                        const [[admin] = {}] = await dbHots.promise().execute(
                            `SELECT user_id FROM user WHERE role_id = 1 AND active = 1 LIMIT 1`
                        );
                        approverId = admin?.user_id || null;
                    }

                    if (approverId) {
                        approvalPromises.push(dbHots.promise().execute(`
                            INSERT INTO t_ticket_event (
                                approval_id, approver_id, approval_order, approval_status,
                                step_type, assigned_value, approver_leader
                            ) VALUES (?, ?, ?, 0, 'superior', ?, 1)
                        `, [ticket_id, approverId, step.step_order, approverId]));
                    }
                }
            }

            await Promise.all(approvalPromises);
            // Handle file uploads
            if (upload_ids && upload_ids.length > 0) {
                await dbHots.promise().execute(`
                    UPDATE t_temp_upload 
                    SET is_used = TRUE, ticket_id = ? 
                    WHERE upload_id IN (${upload_ids.map(() => '?').join(',')})
                `, [ticket_id, ...upload_ids]);
            }


            // Custom functions
            await module.exports.callexecuteCustomFunctions(service_id, ticket_id);





            if (workflowSteps && workflowSteps.length > 0) {

                hotsApproveRequest(false, ticket_id);
            }


            if (mailAddress && mailAddress.length > 0) {
                console.log("mailAddress", mailAddress)

                hotsSubmitMailer(false, ticket_id, user_name, service.service_name, mailAddress[0].email);
            }


            return res.status(200).send({
                success: true,
                message: "CREATE TICKET SUCCESS",
                ticket_id
            });

        } catch (err) {
            console.log(timestamp, "CREATE TICKET FAILED", err);
            return res.status(500).send({
                success: false,
                message: "CREATE TICKET FAILED",
                error: err.message
            });
        }
    },




    // 2. File Upload Handler
    uploadFiles: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        console.log("HOTS uploadFiles called");
        let user_id = req.dataToken.user_id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).send({
                success: false,
                message: "No files uploaded"
            });
        }

        // Track uploaded files in database
        let filePromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                let insertQuery = `
                    INSERT INTO t_temp_upload (file_path, original_filename, uploaded_by)
                    VALUES (?, ?, ?)
                `;

                dbHots.execute(insertQuery, [file.path, file.originalname, user_id], (err, result) => {
                    if (err) reject(err);
                    else resolve({
                        upload_id: result.insertId,
                        newName: file.filename,
                        fileUrl: `/files/hots/it_support/${file.filename}`,
                        fileOriginalName: file.originalname,
                    });
                });
            });
        });

        Promise.all(filePromises)
            .then(results => {
                console.log(timestamp, "FILES UPLOADED SUCCESS");
                return res.status(200).send({
                    success: true,
                    message: "FILES UPLOADED SUCCESSFULLY",
                    data: results,
                    ...(results[0] || {}) // merge first item to top-level
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

    downloadzip: async (req, res) => {
        let date = new Date();
        let timestamp =
            yellowTerminal +
            date.toLocaleDateString("id") +
            " " +
            date.toLocaleTimeString("id") +
            " : ";

        console.log(timestamp + "HOTS downloadzip called");

        const { files } = req.body;
        const user_id = req.dataToken?.user_id;

        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).send({
                success: false,
                message: "No files provided for zipping",
            });
        }

        try {
            // Create unique ZIP file path
            const zipName = `attachments-${user_id || "anon"}-${Date.now()}.zip`;
            const zipPath = path.join(__dirname, "../public/temp", zipName);

            // Ensure temp directory exists
            fs.mkdirSync(path.dirname(zipPath), { recursive: true });

            // Stream setup
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", () => {
                console.log(
                    timestamp +
                    `ZIP created (${(archive.pointer() / 1024).toFixed(2)} KB): ${zipName}`
                );
                res.download(zipPath, zipName, (err) => {
                    if (err) console.error("Error sending zip:", err);
                    fs.unlink(zipPath, () => { }); // 🧹 cleanup after sending
                });
            });

            archive.on("error", (err) => {
                throw err;
            });

            archive.pipe(output);

            // Add each file
            for (const f of files) {
                const cleanPath = f.replace(/^\/+/, ""); // remove leading slashes
                const filePath = path.join(__dirname, "../../public", cleanPath);
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: path.basename(filePath) });
                } else {
                    console.warn(timestamp + "File not found:", filePath);
                }
            }

            await archive.finalize();
        } catch (err) {
            console.error(timestamp + "ZIP creation failed:", err);
            return res.status(500).send({
                success: false,
                message: "ZIP creation failed",
                error: err.message,
            });
        }
    },

    // 3. Get My Tickets (FIXED from your existing)
    getMyTickets: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        // Count total tickets for pagination
        let countQuery = `
                SELECT COUNT(*) as total 
                FROM t_ticket t
                WHERE t.created_by = ?
            `;

        dbHots.execute(countQuery, [user_id], (err, countResult) => {
            if (err) {
                console.log(timestamp, "GET MY TICKETS COUNT ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            let totalData = countResult[0].total;
            let totalPage = Math.ceil(totalData / limit);

            // Get tickets with details
            let queryGetMyTickets = `
                    SELECT 
                        t.ticket_id,
                        t.creation_date,
                        t.service_id,
                        s.service_name,
                        t.status_id,
                        ts.status_name as status,
                        ts.color_hex as color,
                    -- Assigned name depending on type
                                CASE
                                    WHEN tta.assigned_type = 'user' THEN CONCAT(u.firstname, ' ', u.lastname)
                                    WHEN tta.assigned_type = 'team' THEN tm.team_name
                                    WHEN tta.assigned_type = 'department' THEN md.department_name
                                    ELSE NULL
                                END AS assigned_to,

                                JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'type', tta.assigned_type,
                                    'id', tta.assigned_id,
                                    'name', COALESCE(CONCAT(u.firstname, ' ', u.lastname), tm.team_name, md.department_name)
                                )
                                ) AS assigned_list,
                        tm.team_name,
                        t.last_update,
                        t.reject_reason as reason,
                        t.reject_reason as reject_reason,
                        t.fulfilment_comment,
                        1 as approval_level,
                        CASE 
                            WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                            WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                            ELSE 1
                        END as approval_status,
                        (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'approver_id', ae.approver_id,
                                    'approver_name', CONCAT(u.firstname, ' ', u.lastname),
                                    'approval_order', ae.approval_order,
                                    'approval_status', ae.approval_status,
                                    'approver_leader', ae.approver_leader
                                )
                            )
                            FROM t_ticket_event ae
                            LEFT JOIN user u ON u.user_id = ae.approver_id
                            WHERE ae.approval_id = t.ticket_id
                            ORDER BY ae.approval_order
                        ) as list_approval,
                        (
                            SELECT tm2.user_id
                            FROM m_team_member tm2
                            WHERE tm2.team_id = tta.assigned_id AND tm2.team_leader = 1 and tta.assigned_type = 'team'
                            LIMIT 1
                        ) as team_leader_id
                    FROM t_ticket t
                    LEFT JOIN m_service s ON s.service_id = t.service_id
                    LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
                    LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id
                    
                    LEFT JOIN user u ON 
                u.user_id = tta.assigned_id 
                AND tta.assigned_type = 'user'

                LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
                    
                    LEFT JOIN m_department md ON
                md.department_id = tta.assigned_id
                AND tta.assigned_type = 'department'
                    WHERE t.created_by = ?
                    ORDER BY t.creation_date DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;

            dbHots.execute(queryGetMyTickets, [user_id], (err2, results2) => {
                if (err2) {
                    console.log(timestamp, "GET MY TICKETS ERROR: ", err2);
                    return res.status(502).send({
                        success: false,
                        message: err2
                    });
                }

                console.log(timestamp, "GET MY TICKETS SUCCESS");
                return res.status(200).send({
                    success: true,
                    message: "GET MY TICKETS SUCCESS",
                    totalData: totalData,
                    totalPage: totalPage,
                    data: results2
                });
            });
        });
    },

    // 4. Get All Tickets (Admin view)
    getAllTickets: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        // Count total tickets
        let countQuery = `SELECT COUNT(*) as total FROM t_ticket`;

        dbHots.execute(countQuery, (err, countResult) => {
            if (err) {
                console.log(timestamp, "GET ALL TICKETS COUNT ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            let totalData = countResult[0].total;
            let totalPage = Math.ceil(totalData / limit);

            let queryGetAllTickets = `
                    SELECT 
                        t.ticket_id,
                        t.creation_date,
                        t.service_id,
                        s.service_name,
                        t.status_id,
                        ts.status_name as status,
                        ts.color_hex as color,
                          -- Assigned name depending on type
                CASE
                    WHEN tta.assigned_type = 'user' THEN CONCAT(u1.firstname, ' ', u1.lastname)
                    WHEN tta.assigned_type = 'team' THEN tm.team_name
                    WHEN tta.assigned_type = 'department' THEN md.department_name
                    ELSE NULL
                END AS assigned_team,
                        tm.team_name,
                        t.last_update,
                        t.reject_reason as reason,
                        t.fulfilment_comment,
                        CONCAT(u1.firstname, ' ', u1.lastname) as created_by_name,
                        1 as approval_level,
                        CASE 
                            WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                            WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
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
                            FROM t_ticket_event ae
                            LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                            WHERE ae.approval_id = t.ticket_id
                            ORDER BY ae.approval_order
                        ) as list_approval,
                        (
                            SELECT tm2.user_id
                            FROM m_team_member tm2
                            WHERE tm2.team_id = tta.assigned_id AND tm2.team_leader = 1 and tta.assigned_type = 'team'
                            LIMIT 1
                        ) as team_leader_id
                    FROM t_ticket t
                    LEFT JOIN m_service s ON s.service_id = t.service_id
                     LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id
  LEFT JOIN m_department md ON
                md.department_id = tta.assigned_id
                AND tta.assigned_type = 'department'
                    LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id

 LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'

                LEFT JOIN user u1 ON 
                u1.user_id = tta.assigned_id 
                AND tta.assigned_type = 'user'
                   
                    LEFT JOIN user u ON u.user_id = t.created_by
                    ORDER BY t.creation_date DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;

            dbHots.execute(queryGetAllTickets, (err2, results2) => {
                if (err2) {
                    console.log(timestamp, "GET ALL TICKETS ERROR: ", err2);
                    return res.status(502).send({
                        success: false,
                        message: err2
                    });
                }

                console.log(timestamp, "GET ALL TICKETS SUCCESS");
                return res.status(200).send({
                    success: true,
                    message: "GET ALL TICKETS SUCCESS",
                    totalData: totalData,
                    totalPage: totalPage,
                    data: results2
                });
            });
        });
    },

    // 5. Get Task List (tickets assigned to user)
    // Fixed getTaskList function
    getTaskList: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let page = parseInt(req.query.page) || 1;
        let limit = 10;
        let offset = (page - 1) * limit;

        // Count total tasks including approval events
        let countQuery = `
        SELECT COUNT(DISTINCT t.ticket_id) as total 
        FROM t_ticket t
        LEFT JOIN t_ticket_event ae ON ae.approval_id = t.ticket_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

        WHERE (
            (ae.approver_id = ${user_id} AND
                ae.approval_status = 0 
                and t.workflow_step = ae.approval_order
                )
                or
             tta.assigned_type = 'team'
            AND
                tta.assigned_id IN (
                SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ?
            ) OR
            (ae.approver_id = ? AND ae.approval_status = 0 AND ae.approval_order = t.workflow_step)
        )
        AND t.status_id IN (1, 2)
    `;

        dbHots.execute(countQuery, [user_id, user_id, user_id], (err, countResult) => {
            if (err) {
                console.log(timestamp, "GET TASK LIST COUNT ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            let totalData = countResult[0].total;
            let totalPage = Math.ceil(totalData / limit);

            let queryGetTaskList = `
            SELECT DISTINCT
                t.ticket_id,
                t.creation_date,
                t.service_id,
                s.service_name,
                t.status_id,
                ts.status_name as status,
                ts.color_hex as color,
            

                -- Assigned name depending on type
                CASE
                    WHEN tta.assigned_type = 'user' THEN CONCAT(u1.firstname, ' ', u1.lastname)
                    WHEN tta.assigned_type = 'team' THEN tm.team_name
                    WHEN tta.assigned_type = 'department' THEN md.department_name
                    ELSE NULL
                END AS assigned_to,

                JSON_ARRAYAGG(
                JSON_OBJECT(
                    'type', tta.assigned_type,
                    'id', tta.assigned_id,
                    'name', COALESCE(CONCAT(u1.firstname, ' ', u1.lastname), tm.team_name, md.department_name)
                )
                ) AS assigned_list,


                tm.team_name,
                t.last_update,
                t.reject_reason as reason,
                t.fulfilment_comment,
                CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                d.department_name as department_name,
                t.workflow_step,
                t.workflow_step as approval_level,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                    ELSE 1
                END as approval_status,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', ae.approver_id,
                            'approver_name', CONCAT(u2.firstname, ' ', u2.lastname),
                            'approval_order', ae.approval_order,
                            'approval_status', ae.approval_status,
                            'approval_date', ae.approve_date,
                            'approver_leader', ae.approver_leader
                        )
                    )
                    FROM t_ticket_event ae
                    LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                    WHERE ae.approval_id = t.ticket_id
                    ORDER BY ae.approval_order
                ) as list_approval,
                (
                    SELECT tm2.user_id
                    FROM m_team_member tm2
                    WHERE tm2.team_id = tta.assigned_id AND tm2.team_leader = 1 and tta.assigned_type="team"
                    LIMIT 1
                ) as team_leader_id
            FROM t_ticket t
            LEFT JOIN m_service s ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id



            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

LEFT JOIN user u1 ON 
                u1.user_id = tta.assigned_id 
                AND tta.assigned_type = 'user'

            LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'

 LEFT JOIN m_department md ON
                md.department_id = tta.assigned_id
                AND tta.assigned_type = 'department'
                
            LEFT JOIN user u ON u.user_id = t.created_by
            LEFT JOIN m_department d ON d.department_id = u.department_id
            LEFT JOIN t_ticket_event ae ON ae.approval_id = t.ticket_id
            WHERE (
                (ae.approver_id = ${user_id} 
               )
                or
                  tta.assigned_type = 'team'
        AND 
                    tta.assigned_id IN (
                        SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ${user_id}
                    ) OR
                    (ae.approver_id = ${user_id} AND ae.approval_status = 0 AND ae.approval_order = t.workflow_step)
                )
           ORDER BY t.creation_date DESC
            
        `;

            dbHots.execute(queryGetTaskList, [limit, offset], (err2, results2) => {

                if (err2) {
                    console.log(timestamp, "GET TASK LIST ERROR: ", err2);
                    return res.status(502).send({
                        success: false,
                        message: err2
                    });
                }

                return res.status(200).send({
                    success: true,
                    message: "GET TASK LIST SUCCESS",
                    totalData: totalData,
                    totalPage: totalPage,
                    data: results2
                });
            });
        });
    },

    // 6. Get Task Count (active tasks needing user action)
    getTaskCount: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        let countQuery = `
            SELECT COUNT(DISTINCT t.ticket_id) as active_count
            FROM t_ticket t
            LEFT JOIN t_ticket_event ae ON ae.approval_id = t.ticket_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

            WHERE (
                (ae.approver_id = ? AND
                ae.approval_status = 0 
                and t.workflow_step = ae.approval_order
                )
                or
                  tta.assigned_type = 'team'
        AND 
                tta.assigned_id IN (
                    SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ?
                ) OR
                tta.assigned_id = ?
                or
                (ae.approver_id = ? AND ae.approval_status = 0 AND ae.approval_order = t.workflow_step)
            )
            AND t.status_id IN (1, 2, 3)
        `;

        dbHots.execute(countQuery, [user_id, user_id, user_id, user_id], (err, countResult) => {
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
                count: countResult[0].active_count
            });
        });
    },


    // 7. Get Ticket Detail (using your existing format)
    getTicketDetail: (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let ticket_id = req.params.ticket_id;

        if (!ticket_id) {
            return res.status(400).send({
                success: false,
                message: "ticket_id must be provided"
            });
        }

        let queryGetTicketDetail = `
            SELECT 
                t.ticket_id,
                t.creation_date,
                t.service_id,
                s.service_name,
                t.status_id,
                s.widget,
                ts.status_name as status,
                ts.color_hex as color,

                CASE
                    WHEN tta.assigned_type = 'user' THEN CONCAT(u1.firstname, ' ', u1.lastname)
                    WHEN tta.assigned_type = 'team' THEN tm.team_name
                    WHEN tta.assigned_type = 'department' THEN md.department_name
                    ELSE NULL
                END AS assigned_to,

                JSON_ARRAYAGG(
                JSON_OBJECT(
                    'type', tta.assigned_type,
                    'id', tta.assigned_id,
                    'name', COALESCE(CONCAT(u1.firstname, ' ', u1.lastname), tm.team_name, md.department_name)
                )
                ) AS assigned_list,

                tm.team_name,
                t.last_update,
                t.reject_reason as reason,
                t.fulfilment_comment,
                t.workflow_step,
                CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                u.user_id,
                dpt.department_id AS dept_id,
                dpt.department_name AS department_name,
                dpt.department_shortname AS dept_shortname,
                td.*,
                
                -- Current approver information
                (
                    SELECT CONCAT(u3.firstname, ' ', u3.lastname)
                    FROM t_ticket_event ae3
                    LEFT JOIN user u3 ON u3.user_id = ae3.approver_id
                    WHERE ae3.approval_id = t.ticket_id 
                    AND ae3.approval_order = t.workflow_step
                    LIMIT 1
                ) as current_approver_name,
                
                (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                    'order_col', td_sub.order_col,
                    'cstm_col', td_sub.cstm_col,
                    'lbl_col', td_sub.lbl_col
                    )
                )
                FROM (
                    SELECT td.order_col, td.cstm_col, td.lbl_col
                    FROM t_ticket_detail td
                    WHERE td.ticket_id = ?
                    ORDER BY td.order_col
                ) AS td_sub
                ) AS detail_rows,

                (
                    SELECT ae3.approver_id
                    FROM t_ticket_event ae3
                    WHERE ae3.approval_id = t.ticket_id 
                    AND ae3.approval_order = t.workflow_step
                    LIMIT 1
                ) as current_approver_id,
                
                -- Approval status calculation
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_ticket_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
                    ELSE 1
                END as approval_status,
                
                -- File attachments
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
                
                -- Approval events list
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', ae.approver_id,
                            'approver_name', CONCAT(u2.firstname, ' ', u2.lastname),
                            'approval_order', ae.approval_order,
                            'approval_status', ae.approval_status,
                            'approval_date', DATE_FORMAT(ae.approve_date, '%Y-%m-%d %H:%i:%s'),
                            'remark', ae.remark,
                            'approver_leader', ae.approver_leader
                        )
                    )
                    FROM t_ticket_event ae
                    LEFT JOIN user u2 ON u2.user_id = ae.approver_id
                    WHERE ae.approval_id = t.ticket_id
                    ORDER BY ae.approval_order
                ) as list_approval,
                
                (
                    SELECT tm2.user_id
                    FROM m_team_member tm2
                    WHERE tm2.team_id = tta.assigned_id AND tm2.team_leader = 1 and tta.assigned_type="team"
                    LIMIT 1
                ) as team_leader_id
            FROM t_ticket t
            LEFT JOIN m_service s ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id

            LEFT JOIN user u ON 
                u.user_id = tta.assigned_id 
                AND tta.assigned_type = 'user'

             LEFT JOIN m_department md ON
                md.department_id = tta.assigned_id
                AND tta.assigned_type = 'department'

            LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'

            LEFT JOIN user u ON u.user_id = t.created_by
            LEFT JOIN m_department dpt ON dpt.department_id = u.department_id
            LEFT JOIN t_ticket_detail td ON td.ticket_id = t.ticket_id
            WHERE t.ticket_id = ?
        `;

        dbHots.execute(queryGetTicketDetail, [ticket_id, ticket_id], (err, results) => {
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


    putTicketDetail: async (req, res) => {
        const ticket_id = req.params.ticket_id;
        const { detailFields } = req.body; // Expecting an array of { cstm_col, lbl_col, order_col }

        if (!ticket_id || !Array.isArray(detailFields)) {
            return res.status(400).send({
                success: false,
                message: "ticket_id and detailFields[] are required"
            });
        }

        try {
            const updatePromises = detailFields.map((field) => {
                const { cstm_col = '', lbl_col = '', order_col } = field;

                if (!order_col) return null; // skip if order_col is missing

                return dbHots.promise().execute(
                    `
                    INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, order_col)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        cstm_col = VALUES(cstm_col),
                        lbl_col = VALUES(lbl_col)
                    `,
                    [ticket_id, cstm_col, lbl_col, order_col]
                );
            }).filter(Boolean);

            await Promise.all(updatePromises);

            return res.status(200).send({
                success: true,
                message: "Ticket detail updated successfully"
            });
        } catch (err) {
            console.error("PUT TICKET DETAIL FAILED", err);
            return res.status(500).send({
                success: false,
                message: "Failed to update ticket detail",
                error: err.message
            });
        }
    },


    // 9. Reject Ticket
    rejectTicket: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let ticket_id = req.params.ticket_id || req.body.ticket_id;
        let { rejection_remark } = req.body;
        if (!ticket_id || !rejection_remark) {
            return res.status(400).send({
                success: false,
                message: `ticket_id ${ticket_id} and reject_reason ${rejection_remark} are required`
            });
        }

        // Update approval event to rejected
        let updateApprovalQuery = `
                UPDATE t_ticket_event 
                SET approval_status = 2, approve_date = NOW(), remark = ?
                WHERE approval_id = ? AND approver_id = ? AND approval_status = 0
            `;

        dbHots.execute(updateApprovalQuery, [rejection_remark, ticket_id, user_id], (err, result) => {
            if (err) {
                console.log(timestamp, "REJECT TICKET ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            if (result.affectedRows === 0) {
                return res.status(400).send({
                    success: false,
                    message: "No pending approval found for this user"
                });
            }

            // Update ticket status to rejected and set reject_reason
            let updateTicketQuery = `
                    UPDATE t_ticket 
                    SET status_id = 4, reject_reason = ?, last_update = NOW()
                    WHERE ticket_id = ?
                `;

            dbHots.execute(updateTicketQuery, [rejection_remark, ticket_id], (err2) => {
                if (err2) {
                    console.log(timestamp, "UPDATE TICKET STATUS ERROR: ", err2);
                    return res.status(502).send({
                        success: false,
                        message: err2
                    });
                }

                console.log(timestamp, "REJECT TICKET SUCCESS");
                return res.status(200).send({
                    success: true,
                    message: "TICKET REJECTED SUCCESSFULLY"
                });
            });
        });
    },

    closeTicket: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let ticket_id = req.params.ticket_id || req.body.ticket_id;
        if (!ticket_id) {
            return res.status(400).send({
                success: false,
                message: `ticket_id ${ticket_id}  are required`
            });
        }
        console.log(" Trying to close ticket with ticket id ", ticket_id)
        // Update approval event to rejected
        let updateCloseQuery = `
                UPDATE t_ticket 
                SET status_id = 7, last_update = NOW() , reject_reason = "Closed by User"
                where
                ticket_id = ?
            `;

        dbHots.execute(updateCloseQuery, [ticket_id], (err, result) => {



            if (err) {
                console.log(timestamp, "CLOSE TICKET ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }


            console.log(timestamp, "CLOSE TICKET SUCCESS");
            return res.status(200).send({
                success: true,
                message: "TICKET CLOSE SUCCESSFULLY"
            });

        });
    },

    closeTicketservice: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let ticket_id = req.params.ticket_id || req.body.ticket_id;
        if (!ticket_id) {
            return res.status(400).send({
                success: false,
                message: `ticket_id ${ticket_id}  are required`
            });
        }
        console.log(" Trying to close ticket with ticket id ", ticket_id)
        // Update approval event to rejected
        let updateCloseQuery = `
                UPDATE t_ticket 
                SET status_id = 6, last_update = NOW() , reject_reason = "Closed by Service"
                where
                ticket_id = ?
            `;

        dbHots.execute(updateCloseQuery, [ticket_id], (err, result) => {



            if (err) {
                console.log(timestamp, "CLOSE TICKET ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }


            console.log(timestamp, "CLOSE TICKET SUCCESS");
            return res.status(200).send({
                success: true,
                message: "TICKET CLOSE SUCCESSFULLY"
            });

        });
    },


    // 10. Get Ticket Attachments  
    getTicketAttachments: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let ticket_id = req.params.ticket_id;

        if (!ticket_id) {
            return res.status(400).send({
                success: false,
                message: "ticket_id is required"
            });
        }

        let queryGetAttachments = `
                SELECT 
                    attachment_id,
                    url,
                    filename,
                    upload_date
                FROM t_attachment
                WHERE ticket_id = ? AND comment_id IS NULL
                ORDER BY upload_date DESC
            `;

        dbHots.execute(queryGetAttachments, [ticket_id], (err, results) => {
            if (err) {
                console.log(timestamp, "GET ATTACHMENTS ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            console.log(timestamp, "GET ATTACHMENTS SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET ATTACHMENTS SUCCESS",
                data: results
            });
        });
    },
    cleanupOrphanFiles: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        // Find files older than 24 hours that are not used
        let cleanupQuery = `
            SELECT upload_id, file_path 
            FROM t_temp_upload 
            WHERE is_used = FALSE 
            AND upload_date < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;

        dbHots.execute(cleanupQuery, (err, orphanFiles) => {
            if (err) {
                console.log(timestamp, "CLEANUP QUERY ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: err
                });
            }

            if (!orphanFiles.length) {
                return res.status(200).send({
                    success: true,
                    message: "NO ORPHAN FILES TO CLEANUP",
                    deleted_count: 0
                });
            }

            const fs = require('fs');
            let deletedCount = 0;
            let deletePromises = orphanFiles.map(file => {
                return new Promise((resolve) => {
                    // Delete physical file
                    fs.unlink(file.file_path, (unlinkErr) => {
                        if (unlinkErr) {
                            console.log(timestamp, "FILE DELETE ERROR: ", unlinkErr);
                        } else {
                            deletedCount++;
                        }

                        // Delete database record
                        let deleteQuery = `DELETE FROM t_temp_upload WHERE upload_id = ?`;
                        dbHots.execute(deleteQuery, [file.upload_id], (deleteErr) => {
                            if (deleteErr) {
                                console.log(timestamp, "DB DELETE ERROR: ", deleteErr);
                            }
                            resolve();
                        });
                    });
                });
            });

            Promise.all(deletePromises).then(() => {
                console.log(timestamp, "CLEANUP SUCCESS - DELETED:", deletedCount);
                return res.status(200).send({
                    success: true,
                    message: "CLEANUP COMPLETED",
                    deleted_count: deletedCount,
                    total_found: orphanFiles.length
                });
            });
        });
    },

    approveTicket: async (req, res) => {
        const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';
        const user_id = req.dataToken.user_id;
        const ticket_id = req.params.ticket_id;
        const { comment = '' } = req.body;

        if (!ticket_id) {
            return res.status(400).json({ success: false, message: "ticket_id is required" });
        }

        const conn = await dbHots.promise().getConnection();

        try {
            console.log(timestamp, `Approving ticket ${ticket_id} by user ${user_id}`);
            await conn.beginTransaction();

            const [ticketRows] = await conn.query(`
            SELECT 
              t.ticket_id, t.workflow_step, t.service_id, t.status_id,
              ae.approval_order, ae.step_id, ws.step_order
            FROM t_ticket t
            LEFT JOIN t_ticket_event ae ON ae.approval_id = t.ticket_id AND ae.approver_id = ?
            LEFT JOIN t_workflow_step ws ON ws.step_id = ae.step_id
            WHERE t.ticket_id = ? AND ae.approval_status = 0
          `, [user_id, ticket_id]);

            if (!ticketRows.length) {
                await conn.rollback();
                return res.status(400).json({ success: false, message: "No pending approval found for this user" });
            }

            const ticket = ticketRows[0];
            const { current_step, service_id } = ticket;

            console.log("ticket", ticket);

            // ✅ Approve current approver (set remark)
            await conn.query(`
            UPDATE t_ticket_event 
            SET approval_status = 1, approve_date = NOW(), remark = ?
            WHERE approval_id = ? AND approver_id = ? AND approval_status = 0
          `, [comment, ticket_id, user_id]);

            // ✅ Approve others in the same step (parallel)
            await conn.query(`
            UPDATE t_ticket_event ae
            LEFT JOIN t_workflow_step ws ON ws.step_id = ae.step_id
            SET ae.approval_status = 1
            WHERE ae.approval_id = ? AND ae.approval_order = ? AND ae.approval_status = 0
          `, [ticket_id, current_step]);

            console.log(timestamp, `Step ${current_step} approved for ticket ${ticket_id}`);

            // ✅ Check if there is a next step
            const [nextStepCheck] = await conn.query(`
            SELECT COUNT(*) as pending_count, MIN(ae.approval_order) as next_step
            FROM t_ticket_event ae
            LEFT JOIN t_workflow_step ws ON ws.step_id = ae.step_id
            WHERE ae.approval_id = ? AND ae.approval_status = 0
          `, [ticket_id]);

            const hasNext = nextStepCheck[0].pending_count > 0;
            const nextStep = nextStepCheck[0].next_step;

            // ✅ Commit the approval update first
            await conn.commit();
            conn.release(); // ✅ Release connection BEFORE doing triggers

            // ✅ Wait a moment to ensure DB visibility
            await new Promise(r => setTimeout(r, 200));

            // ✅ If there is a next step → move ticket forward
            if (hasNext) {
                await dbHots.promise().query(`
              UPDATE t_ticket 
              SET current_step = ?, last_update = NOW()
              WHERE ticket_id = ?
            `, [nextStep, ticket_id]);

                // ✅ Trigger custom functions (like auto mail/document)
                await module.exports.executeCustomFunctionsByTrigger(
                    service_id,
                    ticket_id,
                    'on_trigger',
                    { approver_id: user_id }
                );

                console.log(timestamp, `Ticket ${ticket_id} moved to step ${nextStep}`);
            } else {
                console.log(timestamp, `Ticket ${ticket_id} fully approved`);

                await dbHots.promise().query(`
              UPDATE t_ticket 
              SET status_id = 3, current_step = NULL, last_update = NOW()
              WHERE ticket_id = ?
            `, [ticket_id]);

                // ✅ Trigger final custom functions
                await module.exports.executeCustomFunctionsByTrigger(
                    service_id,
                    ticket_id,
                    'on_trigger',
                    { final_approver_id: user_id, total_steps: current_step }
                );
            }

            // ✅ Wait again to ensure remark is visible before sending email
            await new Promise(r => setTimeout(r, 150));

            // ✅ Send approval notification email safely (fresh connection)
            await hotsApproveRequest(false, ticket_id);

            return res.status(200).json({
                success: true,
                message: "TICKET APPROVED SUCCESSFULLY",
                data: {
                    ticket_id,
                    current_step: hasNext ? nextStep : null,
                    is_final_approval: !hasNext
                }
            });

        } catch (err) {
            await conn.rollback();
            console.error(timestamp, 'APPROVE TICKET ERROR:', err.message);
            return res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    },



    mapTicketDataToVariables: (ticketData, ticketDetail) => {
        const variables = {
            ticket_id: ticketData.ticket_id,
            requester_name: ticketData.created_by_name || 'N/A',
            created_by: ticketData.created_by || 0,
            requester_department: ticketData.dept_name || ticketData.team_name || 'N/A',
            service_name: ticketData.service_name || 'N/A',
            service_id: ticketData.service_id || 0,
            year: new Date().getFullYear().toString(),
            date: new Date().toISOString().split('T')[0]
        };

        // Use detail_rows if available
        if (ticketDetail?.detail_rows && Array.isArray(ticketDetail.detail_rows)) {
            for (const row of ticketDetail.detail_rows) {
                const label = row.lbl_col?.toLowerCase().trim();
                const value = row.cstm_col;

                if (label && value) {
                    if (label.includes('purpose') || label.includes('reason')) {
                        variables.request_purpose = value;
                    } else if (label.includes('delivery') || label.includes('schedule')) {
                        variables.delivery_schedule = value;
                    } else if (label.includes('manager') && label.includes('approval')) {
                        variables.approval_manager = value;
                    } else if (label.includes('business') && label.includes('analyst')) {
                        variables.business_analyst = value;
                    } else if (label.includes('product') && label.includes('manager')) {
                        variables.product_manager = value;
                    } else if (label.includes('accounting') && label.includes('manager')) {
                        variables.accounting_manager = value;
                    } else if (label.includes('item') || label.includes('list')) {
                        variables.item_list = value;
                    }
                }
            }
        }

        // Set defaults
        variables.request_purpose = variables.request_purpose || 'Sample Request';
        variables.delivery_schedule = variables.delivery_schedule || 'ASAP';
        variables.approval_manager = variables.approval_manager || 'Manager';
        variables.business_analyst = variables.business_analyst || 'Business Analyst';
        variables.product_manager = variables.product_manager || 'Product Manager';
        variables.accounting_manager = variables.accounting_manager || 'Accounting Manager';
        variables.item_list = variables.item_list || 'Sample Items';

        return variables;
    },



    // Add this method to ticketService.js
    executeCustomFunctionsByTrigger: async (serviceId, ticketId, triggerEvent, additionalData = {}) => {
        return new Promise((resolve, reject) => {
            console.log(`Executing custom functions for service ${serviceId}, ticket ${ticketId}, trigger: ${triggerEvent}`);

            const customFunctionQuery = `
            SELECT cf.*, scf.trigger_event, scf.execution_order, scf.config
            FROM m_custom_functions cf
            INNER JOIN t_service_custom_functions scf ON cf.id = scf.function_id
            WHERE scf.service_id = ? AND scf.trigger_event = ? AND scf.is_active = 1
            ORDER BY scf.execution_order
        `;

            dbHots.execute(customFunctionQuery, [serviceId, triggerEvent], (err, customFunctions) => {
                if (err) {
                    console.error('Error fetching custom functions:', err);
                    reject(err);
                    return;
                }

                if (!customFunctions || customFunctions.length === 0) {
                    console.log(`No custom functions found for trigger: ${triggerEvent}`);
                    resolve();
                    return;
                }
                console.log("customFunctions", customFunctions)
                // Get complete ticket data
                const getTicketDataQuery = `
                SELECT 
                    t.ticket_id, t.service_id, s.service_name, t.created_by, t.status_id,
                    CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                    tm.team_name, d.department_name,
                    td.*
                FROM t_ticket t
                LEFT JOIN m_service s ON s.service_id = t.service_id
                LEFT JOIN user u ON u.user_id = t.created_by
            LEFT JOIN t_ticket_assignment tta ON t.ticket_id = tta.ticket_id


                LEFT JOIN m_team tm ON
                tm.team_id = tta.assigned_id 
                AND tta.assigned_type = 'team'
                
                LEFT JOIN m_department d ON d.department_id = u.department_id
                LEFT JOIN t_ticket_detail td ON td.ticket_id = t.ticket_id
                WHERE t.ticket_id = ?
            `;

                dbHots.execute(getTicketDataQuery, [ticketId], async (err2, ticketData) => {
                    if (err2) {
                        reject(err2);
                        return;
                    }

                    if (!ticketData || ticketData.length === 0) {
                        resolve();
                        return;
                    }

                    const ticket = ticketData[0];

                    try {
                        // Execute each custom function
                        for (const customFunction of customFunctions) {
                            console.log(`Executing function: ${customFunction.name} (ID: ${customFunction.id})`);

                            let functionData = {};

                            if (typeof customFunction.config === 'string') {
                                try {
                                    functionData = JSON.parse(customFunction.config);
                                } catch (err) {
                                    console.error('Invalid JSON in customFunction.config:', err);
                                    functionData = {};
                                }
                            } else if (typeof customFunction.config === 'object' && customFunction.config !== null) {
                                functionData = { ...customFunction.config };
                            }

                            functionData.function_id = customFunction.id;
                            functionData.trigger_event = customFunction.trigger_event;

                            // Map ticket data to template variables
                            const variables = module.exports.mapTicketDataToVariables(ticket, ticketData);

                            // Add additional trigger-specific data
                            Object.assign(variables, additionalData);

                            // Log the execution
                            const logQuery = `
                                                                                INSERT INTO t_custom_function_logs (
                                                                                    ticket_id, 
                                                                                    function_name,  
                                                                                    trigger_event, 
                                                                                    status, 
                                                                                    execution_time, 
                                                                                    created_by, 
                                                                                    service_id
                                                                                ) VALUES (?, ?, ?, 'executing', NOW(), ?, ?)
                                                                            `;

                            dbHots.execute(logQuery, [
                                ticketId,
                                customFunction.name,
                                triggerEvent,

                                ticketData.created_by,
                                serviceId
                            ], (logErr, logResult) => {
                                if (logErr) {
                                    console.error('Error logging function execution:', logErr);
                                }
                            });

                            // Execute the actual custom function
                            await module.exports.executeCustomFunction(
                                ticketId,
                                functionData,
                                variables
                            );
                        }
                        resolve();
                    } catch (funcError) {
                        console.error('Error executing custom functions:', funcError);
                        reject(funcError);
                    }
                });
            });
        });
    },
    createTicketEngine: async (req, res) => {
        try {
            // Which module to load?
            const serviceName = req.body.serviceName || "ticketing";
            const formData = req.body;

            // 1. Validate form JSON rules
            const validation = FormLoader.validateFormData(serviceName, formData);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: validation.errors
                });
            }

            // 2. Create ticket ID using your existing logic
            const user_id = req.dataToken.user_id;
            const service_id = req.body.service_id;

            const [resRow] = await dbHots.promise().query(
                queryCheckTicketRow, [user_id, service_id]
            );

            const ticketId = generateID(
                user_id,
                service_id,
                resRow[0].r_number
            );

            // Insert ticket header
            await dbHots.promise().query(
                `INSERT INTO t_ticket 
            (ticket_id, service_id, status_id, created_by, assigned_team, creation_date, reason) 
            VALUES (?, ?, 0, ?, ?, now(), ?)`,
                [ticketId, service_id, user_id, service_id, formData.reason || ""]
            );

            // 3. Convert JSON form inputs → EAV rows
            const eavRows = FormLoader.convertToEAV(serviceName, formData, ticketId);

            // 4. Insert EAV rows
            for (let row of eavRows) {
                await dbHots.promise().query(
                    `INSERT INTO t_ticket_detail (ticket_id, cstm_col, lbl_col, value)
                VALUES (?, ?, ?, ?)`,
                    [row.ticket_id, row.cstm_col, row.lbl_col, row.value]
                );
            }

            // 5. Resolve approvers dynamically (workflow.json)
            const workflowRows = await workflowEngine.resolveApprovers(user_id, serviceName);

            // 6. Insert into t_ticket_event
            await workflowEngine.insertApprovalRows(ticketId, workflowRows);

            // 7. Run on_submit triggers
            await triggerEngine.run(serviceName, "on_submit", ticketId, {
                user_id,
                email: req.dataToken.email,
                subject: formData.subject,
                serviceName,
                data: {
                    ticket_id: ticketId,
                    subject: formData.subject,
                    description: formData.description,
                    user_name: req.dataToken.full_name,
                    creation_date: new Date().toLocaleDateString()
                }
            });

            // Respond
            return res.status(200).json({
                success: true,
                message: "Ticket Engine created successfully",
                ticket_number: ticketId
            });

        } catch (err) {
            console.error("ERROR in createTicketEngine:", err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },








}

//test