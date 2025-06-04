const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require('../../config/db');

const { generateTokenHT, hashPasswordHT } = require('../../config/encrypts');

const { hotsForgotPasswordMailer } = require('../../config/mailer');

let yellowTerminal = "\x1b[33m";

module.exports = {
 
    geProjectAllByUser: async (req, res) => {
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



};
