const {
    dbHots,
    dbQueryHots,
    addSqlLogger
} = require("../../config/db");
const { param } = require("../../routers/auth");
const { uploadFile } = require("../order");

const { io } = require('../../index');

const hotsCheckApprovalLevel = require("../../config/hotsCheckApprovalLevel");
// const { generateTokenHT, hashPasswordHT } = require("../config/encrypts"); 

const fs = require('fs');
const { hotsMailer } = require("../../config/mailer");
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

        if (req.dataToken.user_id) {
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
                    const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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
                    const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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
                            const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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


                        // if (mailAddress && mailAddress.length > 0) {
                        //     // Call the hotsMailer function to send the email
                        //     await hotsMailer(
                        //         mailAddress,
                        //         `[No-Reply] [Ticket ID: ${ticketId}] Your Ticket Has Been Submitted `,
                        //         `
                        //         <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        //             <p>Dear ${fullName},</p>
                        //             <p>Thank you for submitting your ticket. Below are the details of your request: </p>
                        //             <p><strong>Service </strong>: ${service_id} </p>
                        //             <p>IT Support Team</p>
                        //             <p><strong>Ticket Details:</strong> </p>
                        //             <table>
                        //                 <thead>
                        //                 <tr>

                        //                 <td>
                        //                     ticketId
                        //                 </td>
                        //                 <td>
                        //                     analyst_name
                        //                 </td>
                        //                 <td>
                        //                     proposal_no
                        //                 </td>
                        //                 <td>
                        //                     matcode
                        //                 </td>
                        //                 <td>
                        //                     proposal_date
                        //                 </td>

                        //                 </tr>
                        //                 </thead>
                        //                 <tbody>
                        //                 <tr>
                        //                       <td>
                        //                         ${ticketId}
                        //                     </td>
                        //                     <td>
                        //                         ${analyst_name}

                        //                     </td>
                        //                     <td>
                        //                         ${proposal_no}
                        //                     </td>
                        //                     <td>
                        //                         ${sku_id}
                        //                     </td>

                        //                     <td>
                        //                         ${proposal_date}
                        //                     </td>

                        //                 </tr>
                        //                 </tbody>
                        //             </table>
                        //             <p>Your ticket has been successfully received and is currently awaiting processing. </p>
                        //             <p> <strong> Approval List: </strong></p>
                        //             <p>For additional details or to track your request, please visit your ticket in the helpdesk system.</p>
                        //             <p>Thank you </p>
                        //         </div>
                        //         `
                        //     );
                        //     if (firstApproverResult.length > 0) {
                        //     hotsMailer(
                        //         firstapprovermailAddress,
                        //         `[No-Reply] [Ticket ID: {Ticket_Number}] Approval Required `,
                        //         `
                        //         <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        //             <p>Dear ${fullName},</p>
                        //             <p>A new ticket has been submitted and requires your approval. Please review the details below:  </p>
                        //             <p><strong>Service </strong>: ${service_id} </p>
                        //             <p><strong>Ticket ID </strong>: ${ticketId} </p>
                        //             </br>
                        //             <p>Requester Information: </p>
                        //             <p><strong>Requested by	 </strong>: ${service_id} </p>
                        //             <p><strong>Department </strong>: IOD </p>
                        //             <p><strong>Submission Date </strong>: ${timestamp} </p>
                        //             </br>
                        //             <p><strong>Ticket Details </strong>:  </p>
                        //             <table>
                        //                 <thead>
                        //                 <tr>

                        //                 <td>
                        //                     ticketId
                        //                 </td>
                        //                 <td>
                        //                     analyst_name
                        //                 </td>
                        //                 <td>
                        //                     proposal_no
                        //                 </td>
                        //                 <td>
                        //                     matcode
                        //                 </td>
                        //                 <td>
                        //                     proposal_date
                        //                 </td>

                        //                 </tr>
                        //                 </thead>
                        //                 <tbody>
                        //                 <tr>
                        //                       <td>
                        //                         ${ticketId}
                        //                     </td>
                        //                     <td>
                        //                         ${analyst_name}

                        //                     </td>
                        //                     <td>
                        //                         ${proposal_no}
                        //                     </td>
                        //                     <td>
                        //                         ${sku_id}
                        //                     </td>

                        //                     <td>
                        //                         ${proposal_date}
                        //                     </td>

                        //                 </tr>
                        //                 </tbody>
                        //             </table>
                        //             <p>Your ticket has been successfully received and is currently awaiting processing. </p>
                        //             <p> <strong> Approval List: </strong></p>
                        //             <p>For additional details or to track your request, please visit your ticket in the helpdesk system.</p>
                        //             <p>Thank you </p>
                        //         </div>
                        //         `
                        //     );
                        // }else{
                        //     console.log("email not sent for")
                        // }

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
                            const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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
                            const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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
                            const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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
                            const queryInsertApproval = `INSERT INTO t_approval_event (approval_id, approval_order, approver_id) VALUES ?`;
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
                t.reason,
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
                        t_approval_event a
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
                                tm.team_id = t.assigned_team
                            AND
                                tm.team_leader = 1
                            LIMIT 1
                        ) AS team_leader_id
                from
                    t_ticket t
                left join m_service s on
                    t.service_id = s.service_id
                left join user u on
                    u.user_id = t.assigned_to
                left join m_ticket_status ts on
                    ts.status_id = t.status_id
                left join m_team tm on
                    t.assigned_team = tm.team_id
                left join t_approval_event ae on
                    t.ticket_id = ae.approval_id
                where
                t.created_by = ${req.dataToken.user_id}
            
            `

            let countQuery = `
            SELECT COUNT(*) AS total_count
            FROM t_ticket t
            LEFT JOIN m_service s ON t.service_id = s.service_id
            LEFT JOIN user u ON u.user_id = t.assigned_to
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN m_team tm ON t.assigned_team = tm.team_id
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
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
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


            // switch (parseInt(service_id)) {

            //     case 11: // Pricing Structure
            //         let queryGetDataPS = `
            // select
            //     dh.analyst_name,
            //     dh.analyst_id,
            //     dh.country_id,
            //     dh.region_id,
            //     dh.distributor_id,
            //     dh.port_id,
            //     DATE_FORMAT(dh.proposal_date, '%Y-%m-%d') as proposal_date,

            //     dh.proposal_id,
            //     dh.sku_id,
            //     dh.ticket_id,

            //     t.reason,
            //     t.assigned_team,
            //     t.service_id,
            //     s.service_name,
            //     t.assigned_to,
            //     t.status_id,
            //     ts.color_hex,
            //     CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
            //     ts.status_name,
            //     (
            //     select
            //         JSON_ARRAYAGG(
            //                             JSON_OBJECT(
            //                                 'attachment_id', a.attachment_id, 
            //                                 'url', a.url
            //                             )
            //                         )
            //     from
            //         t_attachment a
            //     where
            //         a.ticket_id = d.ticket_id
            //         and
            //                 comment_id is null
            //                 ) as list_foto,
            //     (
            //     select
            //         JSON_ARRAYAGG(
            //             JSON_OBJECT(
            //                 't_ps_id', tpsa.t_ps_id,
            //                 'ticket_id', tpsa.ticket_id,
            //                 'CBP', tpsa.CBP,
            //                 'RBP', tpsa.RBP,
            //                 'DBP', tpsa.DBP,
            //                 'CIF', tpsa.CIF,
            //                 'FOB', tpsa.FOB,
            //                 'TP1', tpsa.TP1,
            //                 'TP2', tpsa.TP2,
            //                 'TP3', tpsa.TP3,
            //                 'Incentive', tpsa.Incentive,
            //                 'COGS', tpsa.COGS,
            //                 'GP_after_freight', tpsa.GP_after_freight,
            //                 'curr_code', tpsa.curr_code
            //             )
            //         )
            //     from
            //         t_ps_summary tpsa
            //     where
            //         tpsa.ticket_id = d.ticket_id
            // ) as list_data,             
            //     (
            //     select
            //         JSON_ARRAYAGG(
            //                             JSON_OBJECT(
            //                                 'approver_id', a.approver_id, 
            //                                 'approval_order', a.approval_order,
            //                                 'approver_name', CONCAT(u.firstname, " ", u.lastname),
            //                                 'approval_status', a.approval_status,
            //                                 'approval_date', DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
            //                                 'cancel_remark', a.rejection_remark

            //                             )
            //                         )
            //     from
            //         t_approval_event a
            //     left join
            //                         user u on
            //         u.user_id = a.approver_id
            //     where
            //         a.approval_id = d.ticket_id 
            //                 ) as list_approval,
            //     (
            //     select
            //         tm.user_id
            //     from
            //         m_team_member tm
            //     where
            //         tm.team_id = t.assigned_team
            //         and
            //                         tm.team_leader = 1
            //     limit 1
            //                 ) as team_leader_id
            // from
            //     t_ps_summary d
            // left join
            //                 t_ticket t on
            //     t.ticket_id = d.ticket_id
            // left join
            //                 m_ticket_status ts on
            //     ts.status_id = t.status_id
            // left join user uc on
            //     uc.user_id = t.created_by
            // left join
            //                 m_service s on
            //     t.service_id = s.service_id
            // left join
            //    t_ps_header dh on
            //     dh.ticket_id = d.ticket_id   
            // where
            //     d.ticket_id = ?
            //     `;
            //         let paramGetDataPS = [ticket_id];

            //         dbHots.execute(queryGetDataPS, paramGetDataPS, (err, results) => {
            //             if (err) {
            //                 console.log(timestamp, "getTicketDetail case 9: Data Update Revision error");
            //                 return res.status(500).send({
            //                     success: false,
            //                     message: err
            //                 });
            //             } else {
            //                 console.log(timestamp, "getTicketDetail case  9 : Data Update Revision Support");
            //                 return res.status(200).send({ data: results });
            //             }
            //         });
            //         break;


            //     case 9: // Data Update
            //         let queryGetDataUpdate = `
            //     select
            //         d.support_id,
            //         d.ticket_id,
            //         d.system_name,
            //         t.reason,
            //         t.assigned_team,
            //         t.service_id,
            //         s.service_name,
            //         t.assigned_to,
            //         t.status_id,
            //         ts.color_hex,
            //         CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
            //         ts.status_name,
            //         (
            //         select
            //             JSON_ARRAYAGG(
            //                     JSON_OBJECT(
            //                         'attachment_id', a.attachment_id, 
            //                         'url', a.url
            //                     )
            //                 )
            //         from
            //             t_attachment a
            //         where
            //             a.ticket_id = d.ticket_id
            //         AND
            //         comment_id IS NULL
            //         ) as list_foto,
            //         (
            //         SELECT
            //                 JSON_ARRAYAGG(
            //                     JSON_OBJECT(
            //                         'approver_id', a.approver_id, 
            //                         'approval_order', a.approval_order,
            //                         'approver_name', CONCAT(u.firstname, " ", u.lastname),
            //                         'approval_status', a.approval_status,
            //                         'approval_date',  DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
            //                         'cancel_remark', a.rejection_remark

            //                     )
            //                 )
            //             FROM
            //                 t_approval_event a
            //             LEFT JOIN
            //                 user u ON u.user_id = a.approver_id
            //             WHERE
            //                 a.approval_id = d.ticket_id 
            //         ) AS list_approval,
            //          (
            //             SELECT
            //                 tm.user_id
            //             FROM
            //                 m_team_member tm
            //             WHERE
            //                 tm.team_id = t.assigned_team
            //             AND
            //                 tm.team_leader = 1
            //             LIMIT 1
            //         ) AS team_leader_id
            //         from
            //             t_data_update d
            //         LEFT JOIN
            //         t_ticket t ON t.ticket_id = d.ticket_id
            //         LEFT JOIN
            //         m_ticket_status ts ON ts.status_id = t.status_id
            //         left join user uc on
            //         uc.user_id = t.created_by
            //         LEFT JOIN
            //         m_service s ON t.service_id = s.service_id  
            //         where
            //             d.ticket_id =?
            //         `;
            //         let paramGetDataUpdate = [ticket_id];

            //         dbHots.execute(queryGetDataUpdate, paramGetDataUpdate, (err, results) => {
            //             if (err) {
            //                 console.log(timestamp, "getTicketDetail case 9: Data Update Revision error");
            //                 return res.status(500).send({
            //                     success: false,
            //                     message: err
            //                 });
            //             } else {
            //                 console.log(timestamp, "getTicketDetail case  9 : Data Update Revision Support");
            //                 return res.status(200).send({ data: results });
            //             }
            //         });
            //         break;


            //     case 8: // Idea Bank
            //         let queryGetIdeaBank = `
            //         select
            //             d.ticket_id,
            //             t.reason,
            //             t.assigned_team,
            //             t.service_id,
            //             t.assigned_to,
            //             d.service_reason,
            //             t.service_id,
            //             t.status_id,
            //             ts.color_hex,
            //             CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
            //             ts.status_name,
            //             (
            //             select
            //                 JSON_ARRAYAGG(
            //                         JSON_OBJECT(
            //                         'attachment_id', a.attachment_id, 
            //                         'url', a.url
            //                     )
            //                 )
            //             from
            //                 t_attachment a
            //             where
            //                 a.ticket_id = d.ticket_id
            //                 and
            //             comment_id is null
            //             ) 
            //             as list_foto,
            //             (
            //             select
            //                 tm.user_id
            //             from
            //                 m_team_member tm
            //             where
            //                 tm.team_id = t.assigned_team
            //                 and
            //                 tm.team_leader = 1
            //             limit 1
            //             ) 
            //             as team_leader_id
            //             from
            //                 t_idea_bank d
            //             left join
            //                                     t_ticket t on
            //                 t.ticket_id = d.ticket_id
            //             left join
            //                                     m_ticket_status ts on
            //                 ts.status_id = t.status_id
            //             left join user uc on
            //                 uc.user_id = t.created_by
            //             LEFT JOIN
            //                 m_service s ON t.service_id = s.service_id      
            //             where
            //                 d.ticket_id = ?
            //             `;

            //         dbHots.execute(queryGetIdeaBank, [ticket_id], (err, results) => {
            //             if (err) {
            //                 console.log(timestamp, `getTicketDetail case ${service_id}: IT tech Support error`);
            //                 return res.status(500).send({
            //                     success: false,
            //                     message: err
            //                 });
            //             } else {
            //                 console.log(timestamp, `getTicketDetail case ${service_id}: IT tech Support`);
            //                 if (results.length > 0) {

            //                     return res.status(200).send({ data: results });
            //                 }
            //                 else {
            //                     return res.status(405).send({ message: "0 data", success: false });

            //                 }
            //             }
            //         });
            //         break;
            //     case 7: // IT tech support
            //         let queryGetITSupport = `
            //         select
            //             d.support_id,
            //             d.ticket_id,
            //             d.type,
            //             t.reason,
            //             t.assigned_team,
            //             t.service_id,
            //             s.service_name,
            //             t.assigned_to,
            //             t.status_id,
            //             ts.color_hex,
            //             CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
            //             ts.status_name,
            //             (
            //             select
            //                 JSON_ARRAYAGG(
            //                         JSON_OBJECT(
            //                             'attachment_id', a.attachment_id, 
            //                             'url', a.url
            //                         )
            //                     )
            //             from
            //                 t_attachment a
            //             where
            //                 a.ticket_id = d.ticket_id
            //             AND
            //             comment_id IS NULL
            //             ) as list_foto,
            //             (
            //             SELECT
            //                     JSON_ARRAYAGG(
            //                         JSON_OBJECT(
            //                             'approver_id', a.approver_id, 
            //                             'approval_order', a.approval_order,
            //                             'approver_name', CONCAT(u.firstname, " ", u.lastname),
            //                             'approval_status', a.approval_status,
            //                             'approval_date',  DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
            //                             'cancel_remark', a.rejection_remark

            //                         )
            //                     )
            //                 FROM
            //                     t_approval_event a
            //                 LEFT JOIN
            //                     user u ON u.user_id = a.approver_id
            //                 WHERE
            //                     a.approval_id = d.ticket_id 
            //             ) AS list_approval,
            //              (
            //                 SELECT
            //                     tm.user_id
            //                 FROM
            //                     m_team_member tm
            //                 WHERE
            //                     tm.team_id = t.assigned_team
            //                 AND
            //                     tm.team_leader = 1
            //                 LIMIT 1
            //             ) AS team_leader_id
            //             from
            //                 t_it_support d
            //             LEFT JOIN
            //             t_ticket t ON t.ticket_id = d.ticket_id
            //             LEFT JOIN
            //             m_ticket_status ts ON ts.status_id = t.status_id
            //             left join user uc on
            //             uc.user_id = t.created_by
            //             LEFT JOIN
            //             m_service s ON t.service_id = s.service_id  
            //             where
            //                 d.ticket_id =?
            //             `;
            //         let paramGetITSupport = [ticket_id];

            //         dbHots.execute(queryGetITSupport, paramGetITSupport, (err, results) => {
            //             if (err) {
            //                 console.log(timestamp, "getTicketDetail case 7: IT tech Support error");
            //                 return res.status(500).send({
            //                     success: false,
            //                     message: err
            //                 });
            //             } else {
            //                 console.log(timestamp, "getTicketDetail case 7: IT tech Support");
            //                 return res.status(200).send({ data: results });
            //             }
            //         });
            //         break;
            //     case 6: //sample request form
            //         let queryGetSampleRequest = `
            //                 select
            //                     d.ticket_id,
            //                     d.purpose,
            //                     d.plant_id,
            //                     d.srf_no,
            //                     d.deliver_to,
            //                     d.request_by,
            //                     d.samplecat_id,
            //                     d.purpose,
            //                     d.executor_remarks,
            //                     t.reason,
            //                     t.assigned_team,
            //                     t.service_id,
            //                     t.assigned_to,
            //                     t.service_id,
            //                     t.status_id,
            //                     s.service_name,
            //                     ts.color_hex,
            //                     CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
            //                     CONCAT(ac.firstname, " ", ac.lastname) as assign_to_username,
            //                     ts.status_name,
            //                     (
            //                     select
            //                         JSON_ARRAYAGG(
            //                                                                                 JSON_OBJECT(
            //                                                                                 'item_name', td.item_name, 
            //                                                                                 'quantity', td.quantity,
            //                                                                                 'quantity_uom', td.quantity_uom,
            //                                                                                 'contain', td.contain,
            //                                                                                 'contain_uom', td.contain_uom
            //                                                                             )
            //                                                                         )
            //                     from
            //                         td_srf td
            //                     where
            //                         td.ticket_id = d.ticket_id
            //                                                                     ) 
            //                                                                     as list_item,
            //                     (
            //                     select
            //                         JSON_ARRAYAGG(
            //                                                                                 JSON_OBJECT(
            //                                                                                 'attachment_id', a.attachment_id, 
            //                                                                                 'url', a.url
            //                                                                             )
            //                                                                         )
            //                     from
            //                         t_attachment a
            //                     where
            //                         a.ticket_id = d.ticket_id
            //                         and
            //                                                                     comment_id is null
            //                                                                     ) 
            //                                                                     as list_foto,
            //                     (
            //                     select
            //                         tm.user_id
            //                     from
            //                         m_team_member tm
            //                     where
            //                         tm.team_id = t.assigned_team
            //                         and
            //                                                                         tm.team_leader = 1
            //                     limit 1
            //                                                                     ) 
            //                                                                     as team_leader_id,
            //                                                                      (
            //             SELECT
            //                 JSON_ARRAYAGG(
            //                     JSON_OBJECT(
            //                         'approver_id', a.approver_id, 
            //                         'approval_order', a.approval_order,
            //                         'approver_name', CONCAT(u.firstname, " ", u.lastname),
            //                         'approval_status', a.approval_status,
            //                         'approval_date',  DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
            //                         'cancel_remark', a.rejection_remark

            //                     )
            //                 )
            //             FROM
            //                 t_approval_event a
            //             LEFT JOIN
            //                 user u ON u.user_id = a.approver_id
            //             WHERE
            //                 a.approval_id = d.ticket_id 
            //         ) AS list_approval
            //                 from
            //                     t_srf d
            //                 left join
            //                     t_ticket t on
            //                     t.ticket_id = d.ticket_id
            //                 left join
            //                     m_ticket_status ts on
            //                     ts.status_id = t.status_id
            //                 left join user uc on
            //                     uc.user_id = t.created_by
            //                 left join user ac on
            //                     ac.user_id = t.assigned_to    
            //                 left join
            //                                                                         m_service s on
            //                     t.service_id = s.service_id
            //                 where
            //                     d.ticket_id = ?
            //         `;

            //         dbHots.execute(queryGetSampleRequest, [ticket_id], (err, results) => {
            //             if (err) {
            //                 console.log(timestamp, `getTicketDetail case ${service_id}: queryGetSampleRequest`);
            //                 return res.status(500).send({
            //                     success: false,
            //                     message: err
            //                 });
            //             } else {
            //                 console.log(timestamp, `getTicketDetail case ${service_id}: queryGetSampleRequest`);
            //                 if (results.length > 0) {

            //                     return res.status(200).send({ data: results });
            //                 }
            //                 else {
            //                     return res.status(405).send({ message: "0 data", success: false });

            //                 }
            //             }
            //         });
            //         break;
            //     case 5:
            //         return res.status(200).send({
            //             success: false,
            //             message: "service_id must be provided "
            //         });;
            //     case 4:
            //         return res.status(200).send({
            //             success: false,
            //             message: "service_id must be provided "
            //         });;
            //     case 3:
            //         return res.status(200).send({
            //             success: false,
            //             message: "service_id must be provided "
            //         });;
            //     case 2:
            //         return res.status(200).send({
            //             success: false,
            //             message: "service_id must be provided "
            //         });;
            //     case 1:
            //         let queryGetPCReq = `
            //         SELECT
            //         d.*,
            //         DATE_FORMAT(t.creation_date, '%Y-%m-%d') AS formatted_creation_date,
            //         DATE_FORMAT(d.date_acquisition, '%Y-%m-%d') AS formatted_date_acquisition,
            //         t.*,
            //         ts.status_name,
            //         ts.color_hex,
            //         s.service_name,
            //         CONCAT(uc.firstname, " ", uc.lastname) AS created_by_username,
            //         (
            //             SELECT
            //                 JSON_ARRAYAGG(
            //                     JSON_OBJECT(
            //                         'approver_id', a.approver_id, 
            //                         'approval_order', a.approval_order,
            //                         'approver_name', CONCAT(u.firstname, " ", u.lastname),
            //                         'approval_status', a.approval_status,
            //                         'approval_date',  DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
            //                         'cancel_remark', a.rejection_remark

            //                     )
            //                 )
            //             FROM
            //                 t_approval_event a
            //             LEFT JOIN
            //                 user u ON u.user_id = a.approver_id
            //             WHERE
            //                 a.approval_id = d.ticket_id 
            //         ) AS list_approval,
            //           (
            //                 SELECT
            //                     tm.user_id
            //                 FROM
            //                     m_team_member tm
            //                 WHERE
            //                     tm.team_id = t.assigned_team
            //                 AND
            //                     tm.team_leader = 1
            //                 LIMIT 1
            //             ) AS team_leader_id
            //         FROM
            //             t_it_support d
            //         LEFT JOIN
            //             t_ticket t ON t.ticket_id = d.ticket_id
            //         LEFT JOIN
            //              m_ticket_status ts ON t.status_id = ts.status_id
            //         LEFT JOIN
            //              user uc ON uc.user_id = t.created_by
            //         LEFT JOIN
            //              m_service s ON t.service_id = s.service_id     
            //         WHERE
            //               t.ticket_id = ?;  
            //     `
            //         let paramGetPCReq = [ticket_id]

            //         dbHots.execute(queryGetPCReq, paramGetPCReq, (err, results) => {
            //             if (err) {
            //                 console.log(timestamp, "getTicketDetail case 1: pc request error", err)
            //                 return res.status(500).send({
            //                     success: false,
            //                     message: err
            //                 });
            //             } else {
            //                 console.log(timestamp, "getTicketDetail case 1: pc request")
            //                 return res.status(200).send({ data: results });
            //             }
            //         })

            //         break;

            //     default:
            //         return res.status(200).send({
            //             success: false,
            //             message: "service_id must be provided "
            //         });
            // }
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
                        UPDATE t_approval_event
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


                        console.log(timestamp, " UPDATE t_approval_event case 11: Pricing Structure");
                        return res.status(200).send({ success: true, message: "Approval updated successfully." });
                    } catch (err) {
                        console.log(timestamp, " UPDATE t_approval_event case 11 : Pricing Structure error", err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    }

                case 7: // IT tech support
                    let querySetApprovalITSupport =
                        `
                        UPDATE t_approval_event
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


                        console.log(timestamp, " UPDATE t_approval_event case 7: IT Support");
                        return res.status(200).send({ success: true, message: "Approval updated successfully." });
                    } catch (err) {
                        console.log(timestamp, " UPDATE t_approval_event case 7: IT Support error", err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    }
                case 6: // Sample request form
                    console.log("Access sample request form Approval");

                    // Update approval event
                    let querySetApprovalRequestSRF = `
                        UPDATE t_approval_event
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
                                    t_approval_event ae
                                WHERE
                                    ae.approval_id = ?
                            `;

                            let querycheckapproved = `
                                SELECT
                                    COUNT(ae.approval_order) AS Approval_unit
                                FROM
                                    t_approval_event ae
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
                        UPDATE t_approval_event
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
                                    t_approval_event ae
                                where
                                    ae.approval_id = ?
                                    
                                `

                            let querycheckapproved =
                                `
                                select
                                    COUNT(ae.approval_order) as Aproval_unit
                                from
                                    t_approval_event ae
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
            t_approval_event
        set
            approve_date = now(),
            approval_status = 2,
            rejection_remark = ?
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
            t.reason,
            t.fulfilment_comment,
            count(ae.approve_date) approval_status,
            (
                SELECT
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'approver_id', a.approver_id, 
                            'approval_order', a.approval_order,
                            'approver_name', CONCAT(u.firstname, " ", u.lastname),
                            'approval_status', a.approval_status,
                            'cancel_remark', a.rejection_remark
                        )
                    )
                FROM
                    t_approval_event a
                LEFT JOIN
                    user u ON u.user_id = a.approver_id
                WHERE
                    a.approval_id = t.ticket_id 
            ) AS list_approval
            from
                t_ticket t
            left join m_service s on
                t.service_id = s.service_id
            left join user u on
                u.user_id = t.assigned_to
            left join m_ticket_status ts on
                ts.status_id = t.status_id
            left join m_team tm on
                t.assigned_team = tm.team_id
            LEFT JOIN t_approval_event ae ON 
                t.ticket_id = ae.approval_id 
            WHERE 
            1=1
            `

            let countQuery = `
            SELECT COUNT(*) AS total_count
            FROM t_ticket t
            LEFT JOIN m_service s ON t.service_id = s.service_id
            LEFT JOIN user u ON u.user_id = t.assigned_to
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN m_team tm ON t.assigned_team = tm.team_id
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
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
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
                t.reason,
                CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
                t.fulfilment_comment,
                (
                    SELECT COUNT(ae.approve_date)
                    FROM t_approval_event ae
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
                                'cancel_remark', a.rejection_remark
                            )
                        )
                    FROM
                        t_approval_event a
                    LEFT JOIN
                        user u ON u.user_id = a.approver_id
                    WHERE
                        a.approval_id = t.ticket_id
                ) AS list_approval
            FROM
                t_ticket t
            LEFT JOIN m_service s ON
                t.service_id = s.service_id
            LEFT JOIN user u ON
                u.user_id = t.assigned_to -- Join for assigned_to user
            LEFT JOIN user uc ON
                uc.user_id = t.created_by -- Self-join for created_by user
            LEFT JOIN m_ticket_status ts ON
                ts.status_id = t.status_id
            LEFT JOIN m_team tm ON
                t.assigned_team = tm.team_id
           LEFT JOIN m_team_member tmm ON
                tmm.team_id = tm.team_id AND tmm.user_id = ${req.dataToken.user_id}
            LEFT JOIN t_approval_event ae ON
                t.ticket_id = ae.approval_id AND ae.approver_id = ${req.dataToken.user_id} -- Left join with the approver_id condition
            WHERE
                (
                    ae.approval_id IS NULL -- Case where there are no approval events
                    OR (
                        ae.approval_id IS NOT NULL -- If t_approval_event exists
                        AND NOT EXISTS (
                            SELECT 1
                            FROM t_approval_event ae_prev
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
                LEFT JOIN m_service s ON t.service_id = s.service_id
                LEFT JOIN t_approval_event ae ON t.ticket_id = ae.approval_id
                LEFT JOIN m_team tm ON t.assigned_team = tm.team_id
                LEFT JOIN m_team_member tmm ON tmm.team_id = tm.team_id AND tmm.user_id = ${req.dataToken.user_id}
                WHERE 
                (
                    (ae.approver_id = ${req.dataToken.user_id} AND 
                    NOT EXISTS (
                        SELECT 1
                        FROM t_approval_event ae_prev
                        WHERE ae_prev.approval_id = t.ticket_id
                        AND ae_prev.approval_order < ae.approval_order 
                        AND ae_prev.approve_date IS NULL 
                    )) 
                    OR t.assigned_to = ${req.dataToken.user_id}  -- The current user is assigned to the ticket
                    OR tmm.team_leader = 1 -- The current user is a team leader for the ticket
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
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
            }

            queryGetMyTiket +=
                `
            AND (
                t.assigned_to = ${req.dataToken.user_id}  -- The current user is assigned to the ticket
                OR ae.approver_id = ${req.dataToken.user_id} -- The current user is an approver for the ticket
                OR tmm.team_leader = 1 -- The current user is a team leader for the ticket
                )
            `

            queryGetMyTiket += `  GROUP BY
            t.ticket_id, s.service_id, s.service_name, u.firstname, u.lastname, ts.status_name, ts.color, tm.team_name, t.last_update, t.reason, 
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
        left join m_team tm on
            t.assigned_team = tm.team_id
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
                left join m_team tm on
                    t.assigned_team = tm.team_id
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
                LEFT JOIN m_team tm ON t.assigned_team = tm.team_id
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

                                return res.status(405).send({
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
                LEFT JOIN m_team tm ON tm.team_id = t.assigned_team
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
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        let service_id = req.params.service_id;
        let { upload_ids, ...formData } = req.body;

        if (!service_id) {
            return res.status(400).send({
                success: false,
                message: "service_id and reason are required"
            });
        }

        // Get service details and workflow
        let serviceQuery = `
            SELECT s.*, wg.id
            FROM m_service s
            LEFT JOIN m_workflow_groups wg ON wg.id = s.m_workflow_groups
            WHERE s.service_id = ?
        `;

        dbHots.execute(serviceQuery, [service_id], (err, serviceResult) => {
            if (err || !serviceResult.length) {
                console.log(timestamp, "GET SERVICE ERROR: ", err);
                return res.status(502).send({
                    success: false,
                    message: "Service not found"
                });
            }

            let service = serviceResult[0];

            const assigned_team = service?.team_id || null;


            // Get workflow steps if workflow exists
            let workflowQuery = `
                SELECT ws.step_order, ws.step_type, ws.assigned_value
                FROM t_workflow_step ws
                WHERE ws.workflow_group_id = ?
                AND ws.is_active = 1
                ORDER BY ws.step_order
            `;

            dbHots.execute(workflowQuery, [service.m_workflow_groups], (err2, workflowSteps) => {
                if (err2) {
                    console.log(timestamp, "GET WORKFLOW ERROR: ", err2);
                    return res.status(502).send({
                        success: false,
                        message: err2
                    });
                }

                // Create main ticket - for workflow tickets, set assigned_to/assigned_team to NULL
                let insertTicketQuery = `
                    INSERT INTO t_ticket (
                        service_id, status_id, created_by, assigned_team, assigned_to,
                        creation_date, last_update,  current_step
                    ) VALUES (?, 1, ?, ?, ?, NOW(), NOW(),  ?)
                `;

                // For workflow tickets, use NULL assignments, for direct tickets use first step
                let assigned_to = null;
                let current_step = 1;

                if (workflowSteps.length === 0) {
                    // No workflow - direct assignment (legacy behavior)
                    assigned_to = user_id; // or some default assignment
                    current_step = 0;
                }

                dbHots.execute(insertTicketQuery, [
                    service_id, user_id, assigned_team, assigned_to, current_step
                ], (err3, ticketResult) => {

                    if (err3) {
                        console.log(timestamp, "CREATE TICKET ERROR: ", err3);
                        return res.status(502).send({
                            success: false,
                            message: err3
                        });
                    }

                    let ticket_id = ticketResult.insertId;

                    // Create ticket details from form data
                    let detailColumns = [];
                    let detailValues = [ticket_id];
                    let detailPlaceholders = ['?'];

                    for (let i = 1; i <= 16; i++) {
                        let cstmCol = `cstm_col${i}`;
                        let lblCol = `lbl_col${i}`;

                        detailColumns.push(cstmCol, lblCol);
                        detailValues.push(formData[cstmCol] || '', formData[lblCol] || '');
                        detailPlaceholders.push('?', '?');
                    }

                    let insertDetailQuery = `
                        INSERT INTO t_ticket_detail (
                            ticket_id, ${detailColumns.join(', ')}
                        ) VALUES (${detailPlaceholders.join(', ')})
                    `;

                    dbHots.execute(insertDetailQuery, detailValues, (err4) => {
                        if (err4) {
                            console.log(timestamp, "CREATE TICKET DETAIL ERROR: ", err4);
                        }
                        console.log("workflowSteps", workflowSteps)
                        // Create approval events for ALL workflow steps
                        if (workflowSteps.length > 0) {

                            console.log("workflow length", workflowSteps.length)
                            let approvalPromises = workflowSteps.map((step, idx) => {
                                return new Promise((resolve, reject) => {
                                    if (step.step_type === 'specific_user' || step.step_type === 'user') {
                                        // Direct user assignment
                                        let insertApprovalQuery = `
                                            INSERT INTO t_approval_event (
                                                approval_id, approver_id, approval_order, approval_status,
                                                step_type, assigned_value
                                            ) VALUES (?, ?, ?, 0, 'user', ?)
                                        `;
                                        console.log(`masuk sudah ${idx + 1} kali`)
                                        dbHots.execute(insertApprovalQuery, [
                                            ticket_id, step.assigned_value, step.step_order, step.assigned_value
                                        ], (err) => {
                                            if (err) reject(err);
                                            else resolve();
                                        });

                                    } else if (step.step_type === 'team') {
                                        // Get team members
                                        let teamQuery = `
                                            SELECT user_id FROM m_team_member WHERE team_id = ?
                                        `;
                                        dbHots.execute(teamQuery, [step.assigned_value], (err, teamMembers) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }

                                            let teamPromises = teamMembers.map(member => {
                                                return new Promise((resolve2, reject2) => {
                                                    let insertApprovalQuery = `
                                                        INSERT INTO t_approval_event (
                                                            approval_id, approver_id, approval_order, approval_status,
                                                            step_type, assigned_value
                                                        ) VALUES (?, ?, ?, 0, 'team', ?)
                                                    `;
                                                    dbHots.execute(insertApprovalQuery, [
                                                        ticket_id, member.user_id, step.step_order, step.assigned_value
                                                    ], (err2) => {
                                                        if (err2) reject2(err2);
                                                        else resolve2();
                                                    });
                                                });
                                            });

                                            Promise.all(teamPromises).then(() => resolve()).catch(reject);
                                        });

                                    } else if (step.step_type === 'role') {
                                        // Get users with this role
                                        let roleQuery = `
                                            SELECT user_id FROM user WHERE user_role = ? AND is_active = 1
                                        `;
                                        dbHots.execute(roleQuery, [step.assigned_value], (err, roleUsers) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }

                                            let rolePromises = roleUsers.map(user => {
                                                return new Promise((resolve2, reject2) => {
                                                    let insertApprovalQuery = `
                                                        INSERT INTO t_approval_event (
                                                            approval_id, approver_id, approval_order, approval_status,
                                                            step_type, assigned_value
                                                        ) VALUES (?, ?, ?, 0, 'role', ?)
                                                    `;
                                                    dbHots.execute(insertApprovalQuery, [
                                                        ticket_id, user.user_id, step.step_order, step.assigned_value
                                                    ], (err2) => {
                                                        if (err2) reject2(err2);
                                                        else resolve2();
                                                    });
                                                });
                                            });

                                            Promise.all(rolePromises).then(() => resolve()).catch(reject);
                                        });

                                    } else if (step.step_type === 'superior') {
                                        // Get user's superior
                                        let superiorQuery = `
                                            SELECT superior_id FROM user WHERE user_id = ?
                                        `;
                                        dbHots.execute(superiorQuery, [user_id], (err, superiorResult) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }

                                            let superior_id = superiorResult[0]?.superior_id;

                                            if (!superior_id) {
                                                // Fallback to admin role
                                                let adminQuery = `
                                                    SELECT user_id FROM user WHERE user_role = 1 AND is_active = 1 LIMIT 1
                                                `;
                                                dbHots.execute(adminQuery, [], (err2, adminResult) => {
                                                    if (err2 || !adminResult.length) {
                                                        reject(new Error('No superior or admin found'));
                                                        return;
                                                    }

                                                    let insertApprovalQuery = `
                                                        INSERT INTO t_approval_event (
                                                            approval_id, approver_id, approval_order, approval_status,
                                                            step_type, assigned_value
                                                        ) VALUES (?, ?, ?, 0, 'superior', ?)
                                                    `;
                                                    dbHots.execute(insertApprovalQuery, [
                                                        ticket_id, adminResult[0].user_id, step.step_order, null
                                                    ], (err3) => {
                                                        if (err3) reject(err3);
                                                        else resolve();
                                                    });
                                                });
                                            } else {
                                                let insertApprovalQuery = `
                                                    INSERT INTO t_approval_event (
                                                        approval_id, approver_id, approval_order, approval_status,
                                                        step_type, assigned_value
                                                    ) VALUES (?, ?, ?, 0, 'superior', ?)
                                                `;
                                                dbHots.execute(insertApprovalQuery, [
                                                    ticket_id, superior_id, step.step_order, superior_id
                                                ], (err2) => {
                                                    if (err2) reject(err2);
                                                    else resolve();
                                                });
                                            }
                                        });
                                    } else {
                                        resolve(); // Unknown step type, skip
                                    }
                                });
                            });
                            console.log("approvalPromises", approvalPromises)

                            Promise.all(approvalPromises)
                                .then(() => {
                                    // Handle file uploads if any
                                    if (upload_ids && upload_ids.length > 0) {
                                        let updateUploadQuery = `
                                            UPDATE t_temp_upload 
                                            SET is_used = TRUE, ticket_id = ? 
                                            WHERE upload_id IN (${upload_ids.map(() => '?').join(',')})
                                        `;
                                        dbHots.execute(updateUploadQuery, [ticket_id, ...upload_ids], (err5) => {
                                            if (err5) {
                                                console.log(timestamp, "UPDATE UPLOAD ERROR: ", err5);
                                            }
                                        });
                                    }

                                    module.exports.callexecuteCustomFunctions(service_id, ticket_id)
                                        .then(() => {
                                            console.log(timestamp, "EXECUTE CUSTOM FUNCTIONS SUCCESS");
                                        })
                                        .catch((funcError) => {
                                            console.log(timestamp, "EXECUTE CUSTOM FUNCTIONS ERROR: ", funcError);
                                        })
                                        .finally(() => {
                                            return res.status(200).send({
                                                success: true,
                                                message: "CREATE TICKET SUCCESS A",
                                                ticket_id: ticket_id
                                            });
                                        });
                                })
                                .catch(err6 => {
                                    console.log(timestamp, "CREATE APPROVAL EVENTS ERROR: ", err6);
                                    return res.status(502).send({
                                        success: false,
                                        message: "Failed to create approval events: " + err6.message
                                    });
                                });
                        } else {
                            console.log(timestamp, "CREATE TICKET SUCCESS (NO WORKFLOW)");

                            // ✅ Use a regular function inside the callback
                            module.exports.callexecuteCustomFunctions(service_id, ticket_id)
                                .then(() => {
                                    console.log(timestamp, "EXECUTE CUSTOM FUNCTIONS SUCCESS");
                                })
                                .catch((funcError) => {
                                    console.log(timestamp, "EXECUTE CUSTOM FUNCTIONS ERROR: ", funcError);
                                })
                                .finally(() => {
                                    return res.status(200).send({
                                        success: true,
                                        message: "CREATE TICKET SUCCESS A",
                                        ticket_id: ticket_id
                                    });
                                });
                        }
                    });
                });
            });
        });
    },



    // 2. File Upload Handler
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
                        file_path: file.path,
                        filename: file.originalname,
                        url: `/files/hots/it_support/${file.filename}` // Adjust based on your file serving setup
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
                    data: results
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
                        t.assigned_to,
                        t.assigned_team,
                        tm.team_name,
                        t.last_update,
                        t.reject_reason as reason,
                        t.reject_reason as reject_reason,
                        t.fulfilment_comment,
                        1 as approval_level,
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

        const page = Number.isInteger(Number(req.query.page)) && Number(req.query.page) > 0
            ? Number(req.query.page)
            : 1;

        const limit = 10;
        const offset = (page - 1) * limit;

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
                        t.assigned_to,
                        t.assigned_team,
                        tm.team_name,
                        t.last_update,
                        t.reject_reason as reason,
                        t.fulfilment_comment,
                        CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                        1 as approval_level,
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
                    LIMIT ${limit} OFFSET ${offset}
                `;

            dbHots.execute(queryGetAllTickets, (err2, results2) => {
                if (err2) {
                    console.log("limit, offset", limit, offset)
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
        LEFT JOIN t_approval_event ae ON ae.approval_id = t.ticket_id
        WHERE (
            (ae.approver_id = ${user_id} AND
                ae.approval_status = 0 
                and t.current_step = ae.approval_order
                )
                or
            t.assigned_team IN (
                SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ?
            ) OR
            (ae.approver_id = ? AND ae.approval_status = 0 AND ae.approval_order = t.current_step)
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
                t.assigned_to,
                t.assigned_team,
                tm.team_name,
                t.last_update,
                t.reject_reason as reason,
                t.fulfilment_comment,
                CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                d.department_name as department_name,
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
            LEFT JOIN m_department d ON d.department_id = u.department_id
            LEFT JOIN t_approval_event ae ON ae.approval_id = t.ticket_id
            WHERE (
                (ae.approver_id = ${user_id} 
               )
                or
                    t.assigned_team IN (
                        SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ${user_id}
                    ) OR
                    (ae.approver_id = ${user_id} AND ae.approval_status = 0 AND ae.approval_order = t.current_step)
                )
           ORDER BY t.creation_date DESC
            
        `;

            dbHots.execute(queryGetTaskList, [limit, offset], (err2, results2) => {
                console.log("results2", results2)
                console.log(timestamp, "GET TASK LIST SUCCESSc", results2, "2");

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
            LEFT JOIN t_approval_event ae ON ae.approval_id = t.ticket_id
            WHERE (
                (ae.approver_id = ? AND
                ae.approval_status = 0 
                and t.current_step = ae.approval_order
                )
                or
                t.assigned_team IN (
                    SELECT tm.team_id FROM m_team_member tm WHERE tm.user_id = ?
                ) OR
                (ae.approver_id = ? AND ae.approval_status = 0 AND ae.approval_order = t.current_step)
            )
            AND t.status_id IN (1, 2)
        `;

        dbHots.execute(countQuery, [user_id, user_id, user_id], (err, countResult) => {
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
                td.*,
                
                -- Current approver information
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
                
                -- Approval status calculation
                CASE 
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 0) THEN 0
                    WHEN EXISTS(SELECT 1 FROM t_approval_event ae WHERE ae.approval_id = t.ticket_id AND ae.approval_status = 2) THEN 2
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
                            'rejection_remark', ae.rejection_remark
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
            LEFT JOIN t_ticket_detail td ON td.ticket_id = t.ticket_id
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
                UPDATE t_approval_event 
                SET approval_status = 2, approve_date = NOW(), rejection_remark = ?
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
              t.ticket_id, t.current_step, t.service_id, t.status_id,
              ae.approval_order, ae.step_id, ws.step_order
            FROM t_ticket t
            LEFT JOIN t_approval_event ae ON ae.approval_id = t.ticket_id AND ae.approver_id = ?
            LEFT JOIN t_workflow_step ws ON ws.step_id = ae.step_id
            WHERE t.ticket_id = ? AND ae.approval_status = 0
          `, [user_id, ticket_id]);

            if (!ticketRows.length) {
                await conn.rollback();
                return res.status(400).json({ success: false, message: "No pending approval found for this user" });
            }

            const ticket = ticketRows[0];
            const { step_order, service_id } = ticket;

            // Approve current approver
            await conn.query(`
            UPDATE t_approval_event 
            SET approval_status = 1, approve_date = NOW(), rejection_remark = ?
            WHERE approval_id = ? AND approver_id = ? AND approval_status = 0
          `, [comment, ticket_id, user_id]);

            // Approve others in same step (parallel)
            await conn.query(`
            UPDATE t_approval_event ae
            LEFT JOIN t_workflow_step ws ON ws.step_id = ae.step_id
            SET ae.approval_status = 1, ae.approve_date = NOW()
            WHERE ae.approval_id = ? AND ae.approval_order = ? AND ae.approval_status = 0
          `, [ticket_id, step_order]);

            console.log(timestamp, `Step ${step_order} approved for ticket ${ticket_id}`);

            // Custom hook per step
            await module.exports.executeCustomFunctionsByTrigger(service_id, ticket_id, 'on_step_approved', {
                step_order,
                approver_id: user_id
            });

            // Check for next pending step
            const [nextStepCheck] = await conn.query(`
            SELECT COUNT(*) as pending_count, MIN(ae.approval_order) as next_step
            FROM t_approval_event ae
            LEFT JOIN t_workflow_step ws ON ws.step_id = ae.step_id
            WHERE ae.approval_id = ? AND ae.approval_status = 0 
          `, [ticket_id]);

            const hasNext = nextStepCheck[0].pending_count > 0;
            const nextStep = nextStepCheck[0].next_step;

            if (hasNext) {
                await conn.query(`
              UPDATE t_ticket 
              SET current_step = ?, last_update = NOW()
              WHERE ticket_id = ?
            `, [nextStep, ticket_id]);

                console.log(timestamp, `Ticket ${ticket_id} moved to step ${nextStep}`);
            } else {
                await conn.query(`
              UPDATE t_ticket 
              SET status_id = 3, current_step = NULL, last_update = NOW()
              WHERE ticket_id = ?
            `, [ticket_id]);

                console.log(timestamp, `Ticket ${ticket_id} fully approved`);

                await module.exports.executeCustomFunctionsByTrigger(service_id, ticket_id, 'on_final_approved', {
                    final_approver_id: user_id,
                    total_steps: step_order
                });

                await module.exports.executeCustomFunctionsByTrigger(service_id, ticket_id, 'on_approved', {
                    approver_id: user_id
                });
            }

            await conn.commit();

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

        // Map custom form fields to specific variables based on labels
        if (ticketDetail) {
            for (let i = 1; i <= 16; i++) {
                const label = ticketDetail[`lbl_col${i}`];
                const value = ticketDetail[`cstm_col${i}`];

                if (label && value) {
                    const normalizedLabel = label.toLowerCase().trim();

                    // Map based on common field labels
                    if (normalizedLabel.includes('purpose') || normalizedLabel.includes('reason')) {
                        variables.request_purpose = value;
                    } else if (normalizedLabel.includes('delivery') || normalizedLabel.includes('schedule')) {
                        variables.delivery_schedule = value;
                    } else if (normalizedLabel.includes('manager') && normalizedLabel.includes('approval')) {
                        variables.approval_manager = value;
                    } else if (normalizedLabel.includes('business') && normalizedLabel.includes('analyst')) {
                        variables.business_analyst = value;
                    } else if (normalizedLabel.includes('product') && normalizedLabel.includes('manager')) {
                        variables.product_manager = value;
                    } else if (normalizedLabel.includes('accounting') && normalizedLabel.includes('manager')) {
                        variables.accounting_manager = value;
                    } else if (normalizedLabel.includes('item') || normalizedLabel.includes('list')) {
                        variables.item_list = value;
                    }
                }
            }
        }

        // Set default values for missing variables
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

                // Get complete ticket data
                const getTicketDataQuery = `
                SELECT 
                    t.ticket_id, t.service_id, s.service_name, t.created_by, t.status_id,
                    CONCAT(u.firstname, ' ', u.lastname) as created_by_name,
                    tm.team_name, d.dept_name,
                    td.*
                FROM t_ticket t
                LEFT JOIN m_service s ON s.service_id = t.service_id
                LEFT JOIN user u ON u.user_id = t.created_by
                LEFT JOIN m_team tm ON tm.team_id = t.assigned_team
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
                            console.log(`Executing function: ${customFunction.function_name} (ID: ${customFunction.function_id})`);

                            const functionData = JSON.parse(customFunction.function_data || '{}');
                            functionData.function_id = customFunction.function_id;
                            functionData.trigger_event = triggerEvent;

                            // Map ticket data to template variables
                            const variables = module.exports.mapTicketDataToVariables(ticket, ticket);

                            // Add additional trigger-specific data
                            Object.assign(variables, additionalData);

                            // Log the execution
                            const logQuery = `
                                                                                INSERT INTO t_custom_function_logs (
                                                                                    function_id, ticket_id, trigger_event, execution_status, 
                                                                                    execution_date, input_data, output_data
                                                                                ) VALUES (?, ?, ?, 'executing', NOW(), ?, NULL)
                                                                            `;

                            dbHots.execute(logQuery, [
                                customFunction.function_id,
                                ticketId,
                                triggerEvent,
                                JSON.stringify({ variables, functionData })
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
    }






}

//test