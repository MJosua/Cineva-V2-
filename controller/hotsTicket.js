const {
    dbHots,
    dbQueryHots,
    addSqlLogger
} = require("../config/db");
const { param } = require("../routers/auth");
const { uploadFile } = require("./order");

const { io } = require('../index');

const hotsCheckApprovalLevel = require("../config/hotsCheckApprovalLevel");
// const { generateTokenHT, hashPasswordHT } = require("../config/encrypts"); 

const fs = require('fs')

const magenta = '\x1b[35m';

let date = new Date();


// UNTUK GENERATE ID
const generateID = (user_id, service_id, row_number) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    // Ensure service_id is a two-digit string
    const formattedServiceID = String(service_id).padStart(2, '0');

    return parseInt(`${year}${month}${day}${formattedServiceID}${user_id}${row_number + 1}`);
}

// UNTUK GENERATE NOMOR BELAKANG ID
const queryCheckTicketRow = `
SELECT COUNT(*) as row_number
FROM ticket t 
WHERE created_by = ? AND service_id = ?
`

const queryCheckTeamRow = `
select
	t.team_id,
	t.user_id,
	s.service_id,
	s.approval_level
from
	team_member t
left join
service s on
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
        let servicetype = 7; // IT Support Request
        const { type, issue_desc } = req.body;

        if (req.dataToken.user_id) {
            try {
                const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [req.dataToken.user_id]);
                const { superior_id: superiorID, final_superior_id: headId } = resSuperior[0];

                const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [servicetype]);
                const { user_id: team_leader, team_id, approval_level: approvalLevel } = resTeam[0];

                let paramTicketCheck = [req.dataToken.user_id, servicetype];
                const [resRow] = await dbHots.promise().query(queryCheckTicketRow, paramTicketCheck);

                // Insert ticket
                let ticketId = generateID(req.dataToken.user_id, servicetype, resRow[0].row_number);

                let queryInsertTicket = `
                    INSERT INTO ticket 
                    (ticket_id, service_id, status_id, created_by, assigned_team, 
                    creation_date, reason)
                    VALUES 
                    (?, ?, 0, ?, ?, 
                    now(), ?);
    
                    INSERT INTO d_it_support (ticket_id, type)
                    VALUES (?, ?);
                `;
                let paramInsertTicket = [
                    ticketId, servicetype, req.dataToken.user_id, team_id, issue_desc,
                    ticketId, type,
                ];
                await dbHots.promise().query(queryInsertTicket, paramInsertTicket);

                // Insert approval events based on approval level
                const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);

                if (paramInsertApproval.length > 0) {
                    const queryInsertApproval = `INSERT INTO approval_event (approval_id, approval_order, approver_id) VALUES ?`;
                    await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                }

                // File attachment
                if (req.files && req.files.length > 0) {
                    let queryInsertFiles = `INSERT INTO attachment (ticket_id, url) VALUES (?, ?);`;
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
    setTicket: async (req, res) => {
        let timestamp = new Date().toLocaleString('id');
        let service_id = req.params.service_id;
        let user_id = req.dataToken.user_id;
        let { ticket_reason, service_reason } = req.body;

        if (service_id) {
            switch (parseInt(service_id)) {
                case 8: // IT tech support
                    try {
                        const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [user_id]);
                        const { superior_id: superiorID } = resSuperior[0];

                        const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [service_id]);
                        const { user_id: team_leader, approval_level: approvalLevel } = resTeam[0];

                        const [resRow] = await dbHots.promise().query(queryCheckTicketRow, [user_id, service_id]);

                        // Generate Ticket ID
                        let ticketId = await generateID(user_id, service_id, resRow[0].row_number);

                        // Insert Ticket and Idea Bank Entry
                        let queryInsertTicket = `
                            INSERT INTO ticket (ticket_id, created_by, reason, service_id, status_id, assigned_team, creation_date)
                            VALUES (?, ?, ?, 8, 0, 8, now());
    
                            INSERT INTO d_idea_bank (ticket_id, service_reason) 
                            VALUES (?, ?);
                        `;

                        await dbHots.promise().query(queryInsertTicket, [ticketId, user_id, ticket_reason, ticketId, service_reason]);

                        // Insert Approval Events
                        const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);
                        if (paramInsertApproval.length > 0) {
                            const queryInsertApproval = `INSERT INTO approval_event (approval_id, approval_order, approver_id) VALUES ?`;
                            await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                        }

                        // File Attachments
                        if (req.files && req.files.length > 0) {
                            let queryInsertFiles = `INSERT INTO attachment (ticket_id, url) VALUES (?, ?);`;
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
                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            message: err.message,
                        });
                        console.log(timestamp, "Error in addTicketITSupport", err);
                    }
                    break;
                default:
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

    , addTicketPCRequest: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // 1 === PCRequest
        let servicetype = 1;
        const { job_desc, reason, laptop_spec_id, old_device, date_acquisition, old_device_spec } = req.body;

        if (req.dataToken.user_id) {
            try {
                const [resSuperior] = await dbHots.promise().query(queryCheckSuperiorRow, [req.dataToken.user_id]);
                const { superior_id: superiorID, final_superior_id: headId } = resSuperior[0];

                const [resTeam] = await dbHots.promise().query(queryCheckTeamRow, [servicetype]);
                const { user_id: team_leader, team_id, approval_level: approvalLevel } = resTeam[0];

                let paramTicketCheck = [req.dataToken.user_id, servicetype];
                const [resRow] = await dbHots.promise().query(queryCheckTicketRow, paramTicketCheck);
                let ticketId = generateID(req.dataToken.user_id, servicetype, resRow[0].row_number);

                let queryInsertTicket = old_device ? `
                INSERT INTO ticket 
                (ticket_id, service_id, status_id, created_by, assigned_team, 
                creation_date, reason)
                VALUES
                (?, ?, 0, ?, ?,
                now(), ? );

                INSERT INTO d_it_support
                (ticket_id, job_desc, laptop_spec_id, old_device, date_acquisition, old_device_spec)
                VALUES
                (?, ?, ?, ?, ?, ?);

                `:
                    `
                INSERT INTO ticket 
                (ticket_id, service_id, status_id, created_by, assigned_team, 
                creation_date, reason)
                VALUES
                (?, ?, 0, ?, ?,
                now(), ? );

                INSERT INTO d_it_support
                (ticket_id, job_desc,  laptop_spec_id)
                VALUES
                (?, ?, ?);

                `

                let paramInsertTicket =
                    old_device ? [
                        ticketId, servicetype, req.dataToken.user_id, team_id, reason,
                        ticketId, job_desc, laptop_spec_id, old_device, date_acquisition, old_device_spec
                    ]
                        :
                        [
                            ticketId, servicetype, req.dataToken.user_id, team_id, reason,
                            ticketId, job_desc, laptop_spec_id
                        ]

                await dbHots.promise().query(queryInsertTicket, paramInsertTicket);


                const paramInsertApproval = hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID);

                if (paramInsertApproval.length > 0) {
                    const queryInsertApproval = `INSERT INTO approval_event (approval_id, approval_order, approver_id) VALUES ?`;
                    await dbHots.promise().query(queryInsertApproval, [paramInsertApproval]);
                }

                res.status(200).send({
                    success: true,
                    message: "ticket has been created",
                    ticket_number: ticketId
                })
                console.log(timestamp, "add Ticket PC Request success ")


            } catch (err) {
                console.log("old_device_spec", old_device_spec)

                res.status(500).send({
                    success: false,
                    message: err.message
                });
                console.log(timestamp, "error addTicketITSupport", err);
            }




        }
        else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            })
            console.log(timestamp, " addTicketPCRequest is Unauthorized ")
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
        const searchBarOnTop = req.query.searchBarOnTop || "";

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
                        approval_event a
                    LEFT JOIN
                        user u ON u.user_id = a.approver_id
                    WHERE
                        a.approval_id = t.ticket_id 
                ) AS list_approval,
                  (
                            SELECT
                                tm.user_id
                            FROM
                                team_member tm
                            WHERE
                                tm.team_id = t.assigned_team
                            AND
                                tm.team_leader = 1
                            LIMIT 1
                        ) AS team_leader_id
                from
                    ticket t
                left join service s on
                    t.service_id = s.service_id
                left join user u on
                    u.user_id = t.assigned_to
                left join ticket_status ts on
                    ts.status_id = t.status_id
                left join team tm on
                    t.assigned_team = tm.team_id
                left join approval_event ae on
                    t.ticket_id = ae.approval_id
                where
                t.created_by = ${req.dataToken.user_id}
            
            `

            let countQuery = `
            SELECT COUNT(*) AS total_count
            FROM ticket t
            LEFT JOIN service s ON t.service_id = s.service_id
            LEFT JOIN USER u ON u.user_id = t.assigned_to
            LEFT JOIN ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN team tm ON t.assigned_team = tm.team_id
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
    getTicketDetail: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let service_id = req.params.service_id
        let ticket_id = req.params.ticket_id


        if (service_id) {
            switch (parseInt(service_id)) {
                case 8: // Idea Bank
                    let queryGetIdeaBank = `
                    select
                        d.ticket_id,
                        t.reason,
                        t.assigned_team,
                        t.service_id,
                        t.assigned_to,
                        d.service_reason,
                        t.status_id,
                        ts.color_hex,
                        CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
                        ts.status_name,
                        (
                        select
                            JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                    'attachment_id', a.attachment_id, 
                                    'url', a.url
                                )
                            )
                        from
                            attachment a
                        where
                            a.ticket_id = d.ticket_id
                            and
                        comment_id is null
                        ) 
                        as list_foto,
                        (
                        select
                            tm.user_id
                        from
                            team_member tm
                        where
                            tm.team_id = t.assigned_team
                            and
                            tm.team_leader = 1
                        limit 1
                        ) 
                        as team_leader_id
                        from
                            d_idea_bank d
                        left join
                                                ticket t on
                            t.ticket_id = d.ticket_id
                        left join
                                                ticket_status ts on
                            ts.status_id = t.status_id
                        left join user uc on
                            uc.user_id = t.created_by
                        where
                            d.ticket_id = ?
                        `;

                    dbHots.execute(queryGetIdeaBank, [ticket_id], (err, results) => {
                        if (err) {
                            console.log(timestamp, `getTicketDetail case ${service_id}: IT tech Support error`);
                            return res.status(500).send({
                                success: false,
                                message: err
                            });
                        } else {
                            console.log(timestamp, `getTicketDetail case ${service_id}: IT tech Support`);
                            if (results.length > 0) {

                                return res.status(200).send({ data: results });
                            }
                            else {
                                return res.status(405).send({ message: "0 data", success: false });

                            }
                        }
                    });
                    break;
                case 7: // IT tech support
                    let queryGetITSupport = `
                    select
                        d.support_id,
                        d.ticket_id,
                        d.type,
                        t.reason,
                        t.assigned_team,
                        t.service_id,
                        t.assigned_to,
                        t.status_id,
                        ts.color_hex,
                        CONCAT(uc.firstname, " ", uc.lastname) as created_by_username,
                        ts.status_name,
                        (
                        select
                            JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'attachment_id', a.attachment_id, 
                                        'url', a.url
                                    )
                                )
                        from
                            attachment a
                        where
                            a.ticket_id = d.ticket_id
                        AND
                        comment_id IS NULL
                        ) as list_foto,
                        (
                        SELECT
                                JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'approver_id', a.approver_id, 
                                        'approval_order', a.approval_order,
                                        'approver_name', CONCAT(u.firstname, " ", u.lastname),
                                        'approval_status', a.approval_status,
                                        'approval_date',  DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
                                        'cancel_remark', a.rejection_remark

                                    )
                                )
                            FROM
                                approval_event a
                            LEFT JOIN
                                user u ON u.user_id = a.approver_id
                            WHERE
                                a.approval_id = d.ticket_id 
                        ) AS list_approval,
                         (
                            SELECT
                                tm.user_id
                            FROM
                                team_member tm
                            WHERE
                                tm.team_id = t.assigned_team
                            AND
                                tm.team_leader = 1
                            LIMIT 1
                        ) AS team_leader_id
                        from
                            d_it_support d
                        LEFT JOIN
                        ticket t ON t.ticket_id = d.ticket_id
                        LEFT JOIN
                        ticket_status ts ON ts.status_id = t.status_id
                        left join user uc on
                        uc.user_id = t.created_by
                        where
                            d.ticket_id =?
                        `;
                    let paramGetITSupport = [ticket_id];

                    dbHots.execute(queryGetITSupport, paramGetITSupport, (err, results) => {
                        if (err) {
                            console.log(timestamp, "getTicketDetail case 7: IT tech Support error");
                            return res.status(500).send({
                                success: false,
                                message: err
                            });
                        } else {
                            console.log(timestamp, "getTicketDetail case 7: IT tech Support");
                            return res.status(200).send({ data: results });
                        }
                    });
                    break;
                case 6: //sample request form
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 5:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 4:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 3:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 2:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 1:
                    let queryGetPCReq = `
                    SELECT
                    d.*,
                    DATE_FORMAT(t.creation_date, '%Y-%m-%d') AS formatted_creation_date,
                    DATE_FORMAT(d.date_acquisition, '%Y-%m-%d') AS formatted_date_acquisition,
                    t.*,
                    ts.status_name,
                    ts.color_hex,
                    CONCAT(uc.firstname, " ", uc.lastname) AS created_by_username,
                    (
                        SELECT
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'approver_id', a.approver_id, 
                                    'approval_order', a.approval_order,
                                    'approver_name', CONCAT(u.firstname, " ", u.lastname),
                                    'approval_status', a.approval_status,
                                    'approval_date',  DATE_FORMAT(a.approve_date, '%Y-%m-%d'),
                                    'cancel_remark', a.rejection_remark

                                )
                            )
                        FROM
                            approval_event a
                        LEFT JOIN
                            user u ON u.user_id = a.approver_id
                        WHERE
                            a.approval_id = d.ticket_id 
                    ) AS list_approval,
                      (
                            SELECT
                                tm.user_id
                            FROM
                                team_member tm
                            WHERE
                                tm.team_id = t.assigned_team
                            AND
                                tm.team_leader = 1
                            LIMIT 1
                        ) AS team_leader_id
                    FROM
                        d_it_support d
                    LEFT JOIN
                        ticket t ON t.ticket_id = d.ticket_id
                    LEFT JOIN
                         ticket_status ts ON t.status_id = ts.status_id
                    LEFT JOIN
                         user uc ON uc.user_id = t.created_by
                    WHERE
                          t.ticket_id = ?;  
                `
                    let paramGetPCReq = [ticket_id]

                    dbHots.execute(queryGetPCReq, paramGetPCReq, (err, results) => {
                        if (err) {
                            console.log(timestamp, "getTicketDetail case 1: pc request error", err)
                            return res.status(500).send({
                                success: false,
                                message: err
                            });
                        } else {
                            console.log(timestamp, "getTicketDetail case 1: pc request")
                            return res.status(200).send({ data: results });
                        }
                    })

                    break;

                default:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });
            }
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
                case 7: // IT tech support
                    let querySetApprovalITSupport =
                        `
                        UPDATE approval_event
                        SET 
                            approve_date = NOW(), 
                            approval_status = 1
                        WHERE 
                            approval_id = ?
                            and
                            approver_id = ?
                    `;

                    let queryUpdateTicketITSupport = `
                        UPDATE ticket
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


                        console.log(timestamp, " UPDATE approval_event case 7: IT Support");
                        return res.status(200).send({ success: true, message: "Approval updated successfully." });
                    } catch (err) {
                        console.log(timestamp, " UPDATE approval_event case 7: IT Support error", err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    }
                case 6: //sample request form
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 5:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 4:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 3:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 2:
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
                case 1:
                    console.log("Access IT REQUEST Approval")
                    let querySetApprovalRequest =
                        `
                        UPDATE approval_event
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
                                    approval_event ae
                                where
                                    ae.approval_id = ?
                                    
                                `

                            let querycheckapproved =
                                `
                                select
                                    COUNT(ae.approval_order) as Aproval_unit
                                from
                                    approval_event ae
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
                                            UPDATE ticket
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
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });
            }
        } else {
            res.status(500).send({
                success: false,
                message: "service_id must be provided "
            })
            console.log(timestamp, "getTicketDetail service_id is not provided ")
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
            approval_event
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
        ticket
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
                        laptop_spec ls
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
        const searchBarOnTop = req.query.searchBarOnTop || "";



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
                    approval_event a
                LEFT JOIN
                    user u ON u.user_id = a.approver_id
                WHERE
                    a.approval_id = t.ticket_id 
            ) AS list_approval
            from
                ticket t
            left join service s on
                t.service_id = s.service_id
            left join user u on
                u.user_id = t.assigned_to
            left join ticket_status ts on
                ts.status_id = t.status_id
            left join team tm on
                t.assigned_team = tm.team_id
            LEFT JOIN approval_event ae ON 
                t.ticket_id = ae.approval_id 
            WHERE 
            1=1
            `

            let countQuery = `
            SELECT COUNT(*) AS total_count
            FROM ticket t
            LEFT JOIN service s ON t.service_id = s.service_id
            LEFT JOIN USER u ON u.user_id = t.assigned_to
            LEFT JOIN ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN team tm ON t.assigned_team = tm.team_id
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

            queryGetMyTiket += `  ORDER BY t.ticket_id DESC  `


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
    getTaskList: async (req, res) => {
        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        ///hots_ticket/my_tiket

        const limit = parseInt(req.query.limit, 10) || 10;
        const currentPage = parseInt(req.query.page, 10) || 1;

        const status = req.query.status || "";
        const category = req.query.category || "";
        const searchBarOnTop = req.query.searchBarOnTop || "";



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
                    FROM approval_event ae
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
                        approval_event a
                    LEFT JOIN
                        user u ON u.user_id = a.approver_id
                    WHERE
                        a.approval_id = t.ticket_id
                ) AS list_approval
            FROM
                ticket t
            LEFT JOIN service s ON
                t.service_id = s.service_id
            LEFT JOIN user u ON
                u.user_id = t.assigned_to -- Join for assigned_to user
            LEFT JOIN user uc ON
                uc.user_id = t.created_by -- Self-join for created_by user
            LEFT JOIN ticket_status ts ON
                ts.status_id = t.status_id
            LEFT JOIN team tm ON
                t.assigned_team = tm.team_id
            LEFT JOIN approval_event ae ON
                t.ticket_id = ae.approval_id AND ae.approver_id = ${req.dataToken.user_id} -- Left join with the approver_id condition
            WHERE
                (
                    ae.approval_id IS NULL -- Case where there are no approval events
                    OR (
                        ae.approval_id IS NOT NULL -- If approval_event exists
                        AND NOT EXISTS (
                            SELECT 1
                            FROM approval_event ae_prev
                            WHERE ae_prev.approval_id = t.ticket_id
                            AND ae_prev.approval_order < ae.approval_order
                            AND ae_prev.approve_date IS NULL
                        )
                    )
                )
            OR t.assigned_to = ${req.dataToken.user_id} -- Case where user is assigned to the ticket

            `

            let countQuery = `
            SELECT
                COUNT(DISTINCT t.ticket_id) AS total_count 
            FROM
                ticket t
            LEFT JOIN service s ON
                t.service_id = s.service_id
            LEFT JOIN approval_event ae ON 
                t.ticket_id = ae.approval_id 
            WHERE 
                ae.approver_id = ${req.dataToken.user_id} 
                AND NOT EXISTS (
                    SELECT 1
                    FROM approval_event ae_prev
                    WHERE ae_prev.approval_id = t.ticket_id
                    AND ae_prev.approval_order < ae.approval_order 
                    AND ae_prev.approve_date IS NULL 
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


            queryGetMyTiket += `  GROUP BY
            t.ticket_id, s.service_id, s.service_name, u.firstname, u.lastname, ts.status_name, ts.color, tm.team_name, t.last_update, t.reason, 
            t.fulfilment_comment
            `

            queryGetMyTiket += ` ORDER BY
            t.ticket_id DESC
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
            ticket t
        left join service s on
            t.service_id = s.service_id
        left join ticket_status ts on
            ts.status_id = t.status_id
        left join team tm on
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
                    ticket t
                left join service s on
                    t.service_id = s.service_id
                left join ticket_status ts on
                    ts.status_id = t.status_id
                left join team tm on
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
                FROM ticket t
                LEFT JOIN service s ON t.service_id = s.service_id
                LEFT JOIN ticket_status ts ON ts.status_id = t.status_id
                LEFT JOIN team tm ON t.assigned_team = tm.team_id
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
                        DATE_FORMAT(c.date_created, '%W, ') as day_created,
                        DATE_FORMAT(c.date_created,'%d-%b-%Y ') as date_created,
                        DATE_FORMAT(c.date_created, '%H:%i') as time_created,
                        a.attachment_id,
                        a.url as attachment_url,
                        CONCAT(u.firstname, " ", u.lastname) as sender
                    from
                        comment c
                    left join 
                        attachment a on
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
                SELECT COUNT(comment_id) cnt FROM comment WHERE ticket_id = ?
                
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
                        comment c
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
                        comment
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
                                        attachment (ticket_id, url, comment_id) 
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
            UPDATE ticket
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
            UPDATE ticket
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
            UPDATE ticket
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
                UPDATE ticket
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
                        console.log(timestamp, `paramUpdateStatus  ${ticket_id} : status updated`);
                        return res.status(200).send({ message: "success" });
                    }
                });



            }
        });
    },




}