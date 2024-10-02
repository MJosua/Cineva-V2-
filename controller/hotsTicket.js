const {
    dbHots,
    dbQueryHots,
    addSqlLogger
} = require("../config/db");
const { param } = require("../routers/auth");
const { uploadFile } = require("./order");
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
WHERE created_by = ? AND service_id = ?;
`

module.exports = {
    addTicketITSupport: async (req, res) => {

        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        // 7 === IT SUpport Request
        let servicetype = 7;

        const { assigned_to, type, issue_desc, attachment } = req.body

        if (req.dataToken.user_id) {


            let paramTicketCheck = [
                req.dataToken.user_id, servicetype
            ]


            dbHots.query(queryCheckTicketRow, paramTicketCheck, async (err, resRow) => {
                if (err) {

                    res.status(500).send({
                        success: false,
                        message: err
                    })
                    console.log(timestamp, " error addTicketITSupport When Checking Row ", err)
                    return;
                } else {

                    let queryInsertTicket = `
                    INSERT INTO ticket 
                    (ticket_id, service_id, status_id, created_by, assigned_team, 
                    assigned_to, creation_date)
                    VALUES
                    (?, 7, 0, ?, 1,
                     ?, now());
        
                    INSERT INTO d_it_support
                    (ticket_id, type, issue_desc)
                    VALUES
                    (?, ?, ?);
        
                    `

                    let paramInsertTicket = [
                        generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), req.dataToken.user_id, assigned_to,
                        generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), type, issue_desc
                    ]

                    dbHots.query(queryInsertTicket, paramInsertTicket, async (err, results) => {
                        if (err) {

                            res.status(500).send({
                                success: false,
                                message: err
                            })
                            console.log(timestamp, " error addTicketITSupport ", err)
                            return;

                        } else {

                            if (req.files && req.files.length > 0) {
                                let queryInsertFiles = `
                                    INSERT INTO attachment
                                    (ticket_id, url)
                                    VALUES (?, ?);
                                `;

                                // Loop through each file and store the URL
                                for (let file of req.files) {
                                    let file_url = `/public/files/hots/it_support/${file.filename}`;
                                    let paramInsertFile = [generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), file_url];

                                    dbHots.query(queryInsertFiles, paramInsertFile, (err, fileResult) => {
                                        if (err) {
                                            console.log(timestamp, " addTicketITSupport Failed ", generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), `at image upload`)

                                            res.status(500).send({
                                                success: false,
                                                message: err
                                            });

                                            return
                                        } else {
                                            console.log("File URL inserted:", file_url);
                                            res.status(200).send({
                                                success: true,
                                                message: "ticket has been created",
                                                ticket_number: generateID(req.dataToken.user_id, servicetype, resRow[0].row_number)
                                            })
                                            console.log(timestamp, " addTicketITSupport success ", generateID(req.dataToken.user_id, servicetype, resRow[0].row_number))

                                        }
                                    });
                                }
                            } else {
                                res.status(200).send({
                                    success: true,
                                    message: "ticket has been created",
                                    ticket_number: generateID(req.dataToken.user_id, servicetype, resRow[0].row_number)
                                })
                                console.log(timestamp, " addTicketITSupport success ", generateID(req.dataToken.user_id, servicetype, resRow[0].row_number))

                            }
                        }
                    })


                }

            })







        } else {
            res.status(401).send({
                success: false,
                message: `Unauthorized`
            })
            console.log(timestamp, " addTicketITSupport is Unauthorized ")
        }


    }
    , addTicketPCRequest: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // 1 === PCRequest
        let servicetype = 1;


        const { job_desc, reason, laptop_spec_id, old_device, date_acquisition, old_device_spec } = req.body;



        if (req.dataToken.user_id) {

            let paramTicketCheck = [
                req.dataToken.user_id, 1
            ]

            dbHots.query(queryCheckTicketRow, paramTicketCheck, async (err, resRow) => {
                if (err) {

                    res.status(500).send({
                        success: false,
                        message: err
                    })
                    console.log(timestamp, " error addTicketITSupport When Checking Row ", err)

                } else {

                    let queryInsertTicket = old_device ? `
                    INSERT INTO ticket 
                    (ticket_id, service_id, status_id, created_by, assigned_team, 
                    assigned_to, creation_date, reason)
                    VALUES
                    (?, ?, 0, ?, 1,
                    7, now(), ? );

                    INSERT INTO d_pc_request
                    (ticket_id, job_desc, laptop_spec_id, old_device, date_acquisition, old_device_spec)
                    VALUES
                    (?, ?, ?, ?, ?, ?);

                    `:
                        `
                    INSERT INTO ticket 
                    (ticket_id, service_id, status_id, created_by, assigned_team, 
                    assigned_to, creation_date, reason)
                    VALUES
                    (?, ?, 0, ?, 1,
                    7, now(), ? );

                    INSERT INTO d_pc_request
                    (ticket_id, job_desc,  laptop_spec_id)
                    VALUES
                    (?, ?, ?);

                    `

                    let paramInsertTicket =
                        old_device ? [
                            generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), servicetype, req.dataToken.user_id, reason,
                            generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), job_desc, laptop_spec_id, old_device, date_acquisition, old_device_spec
                        ]
                            :
                            [
                                generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), servicetype, req.dataToken.user_id, reason,
                                generateID(req.dataToken.user_id, servicetype, resRow[0].row_number), job_desc, laptop_spec_id
                            ]


                    dbHots.query(queryInsertTicket, paramInsertTicket, async (err, results) => {

                        if (err) {

                            res.status(500).send({
                                success: false,
                                message: err
                            })
                            console.log(timestamp, " error addTicketPCRequest ", err)

                        } else {

                            res.status(200).send({
                                success: true,
                                message: "ticket has been created",
                                ticket_number: results[0].insertId
                            })
                            console.log(timestamp, " addTicketPCRequest success ")
                        }
                    })
                }
            })
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
    }
    , getMyTiket: async (req, res) => {
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
            CONCAT(u.firstname, " ", u.lastname) assigned_to,
            ts.status_name status,
            ts.color,
            tm.team_name,
            t.last_udpate,
            t.reason,
            t.fulfilment_comment
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
                queryGetMyTiket += ` AND ts.status_id = ${status} `;
                countQuery += ` AND ts.status_id = ${status} `;
            }

            if ((category !== "" || category) && category !== "-1") {
                queryGetMyTiket += ` AND  s.service_id = ${category} `;
                countQuery += ` AND  s.service_id = ${category} `;
            }

            if (searchBarOnTop && searchBarOnTop !== "") {
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
            }

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
    , getTicketDetail: async (req, res) => {

        let date = new Date();
        let timestamp = magenta + date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let service_id = req.params.service_id
        let ticket_id = req.params.ticket_id

        console.log(req.dataToken)

        if (service_id) {
            switch (service_id) {
                case 7: //it tech support

                    let queryGetITSupport = `SELECT * FROM d_it_support dis WHERE dis.ticket_id = ?`
                    let paramGetITSupport = [ticket_id]

                    dbHots.execute(queryGetITSupport, paramGetITSupport, (err, results) => {
                        if (err) {
                            console.log(timestamp, "getTicketDetail case 7: IT tech Support error")
                            return res.status(500).send({
                                success: false,
                                message: err
                            })
                        } else {
                            console.log(timestamp, "getTicketDetail case 7: IT tech Support")
                            return res.status(200).send(results)
                        }
                    })
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
                    let queryGetPCReq = `SELECT * FROM d_pc_request dpr WHERE dpr.ticket_id = ?`
                    let paramGetPCReq = [ticket_id]

                    dbHots.execute(queryGetPCReq, paramGetPCReq, (err, results) => {
                        if (err) {
                            console.log(timestamp, "getTicketDetail case 7: pc request error")
                            return res.status(500).send({
                                success: false,
                                message: err
                            })
                        } else {
                            console.log(timestamp, "getTicketDetail case 7: pc request")
                            return res.status(200).send(results)
                        }
                    })
                    return res.status(200).send({
                        success: false,
                        message: "service_id must be provided "
                    });;
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
            CONCAT(u.firstname, " ", u.lastname) assigned_to,
            ts.status_name status,
            ts.color,
            tm.team_name,
            t.last_udpate,
            t.reason,
            t.fulfilment_comment
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
                queryGetMyTiket += ` AND ts.status_id = ${status} `;
                countQuery += ` AND ts.status_id = ${status} `;
            }

            if ((category !== "" || category) && category !== "-1") {
                queryGetMyTiket += ` AND  s.service_id = ${category} `;
                countQuery += ` AND  s.service_id = ${category} `;
            }

            if (searchBarOnTop && searchBarOnTop !== "") {
                queryGetMyTiket += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
                countQuery += ` AND ( LOWER(t.ticket_id) LIKE LOWER('%${searchBarOnTop}%') OR LOWER(t.reason) LIKE LOWER('%${searchBarOnTop}%') ) `;
            }

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

    }
    , getFullFilledTiketCount: async (req, res) => {
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
    }


}