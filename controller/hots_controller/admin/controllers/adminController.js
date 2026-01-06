const {
    dbHots,
    dbQueryHots,
} = require("../../../../config/db");
const { generateTokenHT, hashPasswordHT } = require("../../../../config/encrypts");
const { hotsForgotPasswordMailer } = require('../../../../service/mailer/hots/hots_mailer');
// const cookieParser = require('cookie-parser');

const redColor = '\x1b[31m'; // Red 
const reset = '\\x1b[0m';

module.exports = {

    getAccount: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        //untuk pagination
        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let desc = req.query.desc ? `order by u.uid ASC ` : `order by u.uid DESC`;
        let find = req.query.find ? ` AND u.uid LIKE '%${req.query.find}%'   ` : ''

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        if (req.dataToken.role_id = 4) {

            let queryGetAccount = ` 
            SELECT
                u.user_id, 
                u.firstname,
                u.lastname,
                u.uid,
                u.last_pswd_changed,
                u.active,
                u.email,
                u.nik,
                u.phone,
                u.grade_id,
                r.role_name,
                d.department_name,  
                u.superior_id 
            FROM
                user u
            LEFT JOIN m_role r ON
                u.role_id = r.role_id 
            LEFT JOIN m_department d ON 
                u.department_id = d.department_id
            WHERE r.role_id IN (1,2,4) `+ desc + find;

            dbHots.execute(queryGetAccount, (err, results) => {

                if (err) {

                    res.status(500).send({ success: false, message: err });
                    console.log(timestamp + "Error getAccount !", err)

                } else {
                    if (results[0]) {

                        let packet = results.slice(startIndex, endIndex)
                        let totalDataLength = results.length
                        let totalPage = Math.round(results.length / limit)

                        res.status(200).send({ packet, totalPage, totalDataLength, page });
                        console.log(timestamp + " getAccount success !")

                    } else {

                        let packet = []
                        let totalDataLength = 0
                        let totalPage = 0

                        res.status(200).send({ packet, totalPage, totalDataLength, page });
                        console.log(timestamp + " getAccount success no data!")
                    }
                }

            })

        } else {
            res.status(401).send({
                success: false,
                message: "UNATHORIZED ADMIN ONLY"
            })
        }


    }
    , createAccount: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let {
            firstname,
            lastname,
            email,
            department_id,
            description,
            superior_id,
            nik,
            phone,
            grade
        } = req.body


        if (req.dataToken.role_id = 4) {

            let queryInsert = `INSERT INTO user (
             firstname, lastname, uid, email,
                department_id, description, superiorID,
                 pswd, asin,
                  nik, phone, grade,
                  role_id)
                VALUES
                (?,?,?,?,
                ?,?,?,
                ?,?, 
                ?, ?, ?,
                ?)`

            let paramInsert = [
                firstname, lastname, `${firstname}.${lastname}`, email,
                department_id, description, superior_id,
                "hanya Tuhan dan user yg tau", "hanya Tuhan dan user yg tau",
                nik, phone, grade]

            dbHots.query(queryInsert, paramInsert, (err) => {
                if (err) {
                    res.status(500).send({
                        success: false,
                        message: err
                    })
                    console.log(timestamp, "HOTS error at create account", err)
                } else {
                    res.status(200).send({
                        success: true,
                        message: "successfuly add add user"
                    })
                    console.log(timestamp, "HOTS  create account success ", `${firstname}.${lastname}`)

                }
            })
        } else {
            res.status(401).send({
                success: false,
                message: "UNATHORIZED ADMIN ONLY"
            })
        }


    }
    , editAccount: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.role_id = 4) {

            let queryGetAccountData = `SELECT 
            u.user_id,
            u.firstname,
            u.lastname, 
            u.uid,
            u.last_pswd_changed,
            u.active,
            u.email,
            u.role_id,
            u.department_id,
            u.superior_id,
            u.plant_id,
            u.nik,
            u.phone,
            u.grade_id
        FROM
            user su
        WHERE su.user_id = ?`

            let paramGetAccountData = [req.params.user_id]

            dbHots.execute(queryGetAccountData, paramGetAccountData, (err, results) => {

                if (err) {
                    res.status(500).send({
                        success: false,
                        message: err
                    })
                    console.log(timestamp, " error at editAccount - getAccountData ", err)
                } else {

                    if (results[0]) {
                        let prevData = results[0]
                        let firstname = req.body.firstname ? req.body.firstname : prevData.firstname
                        let lastname = req.body.lastname ? req.body.lastname : prevData.lastname
                        let uid = req.body.uid ? req.body.uid : prevData.uid
                        let email = req.body.email ? req.body.email : prevData.email
                        let role_id = req.body.role_id ? req.body.role_id : prevData.role_id
                        let department_id = req.body.department_id ? req.body.department_id : prevData.department_id
                        let superior_id = req.body.superior_id ? req.body.superior_id : prevData.superior_id
                        let plant_id = req.body.plant_id ? req.body.plant_id : prevData.plant_id
                        let nik = req.body.nik ? req.body.nik : prevData.nik
                        let phone = req.body.phone ? req.body.phone : prevData.phone
                        let grade = req.body.grade ? req.body.grade : prevData.grade


                        let queryUpdateData = `UPDATE master_employee
                                                SET firstname = ?,
                                                    lastname = ?, 
                                                    uid = ?, 
                                                    email = ?,
                                                    role_id = ?,
                                                    department_id = ?,
                                                    superior_id = ?,
                                                    plant_id = ?,
                                                    nik = ?,
                                                    phone = ?,
                                                    grade = ?
                                            WHERE user_id = ?;`
                        let paramUpdateData = [firstname,
                            lastname,
                            uid,
                            email,
                            role_id,
                            department_id,
                            superior_id,
                            plant_id,
                            nik,
                            phone,
                            grade,
                            req.params.user_id]

                        dbHots.execute(queryUpdateData, paramUpdateData, (err) => {
                            if (err) {
                                res.status(500).send({
                                    success: false,
                                    message: err
                                })
                                console.log(timestamp, " error at editAccount - updateData ", err)
                            } else {
                                res.status(200).send({
                                    success: false,
                                    message: `Successfully update account uid ${uid}`
                                })
                            }
                        })
                    } else {
                        res.status(200).send({
                            success: false,
                            message: "no prev data"
                        })
                        console.log(timestamp, " error at editAccount - getAccountData ", err)
                    }


                }
            })
        } else {
            res.status(401).send({
                success: false,
                message: "UNATHORIZED ADMIN ONLY"
            })
        }


    }
    , deleteAccount: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        // DELETE FROM sys_user WHERE user_id = ?;
        if (req.dataToken.role_id = 4) {

            if (req.params.user_id) {

                let queryInsert = `DELETE FROM user WHERE user_id = ?`

                let paramInsert = [req.params.user_id]

                dbHots.query(queryInsert, paramInsert, (err) => {
                    if (err) {
                        res.status(500).send({
                            success: false,
                            message: err
                        });
                        console.log(timestamp, " error at deleteAccount ", err);

                    } else {
                        res.status(200).send({
                            success: true,
                            message: "successfuly add add user"
                        });
                        console.log(timestamp, " successfully delete account ", req.params.user_id);
                    }
                })
            } else {
                res.status(200).send({
                    success: false,
                    message: "user_id is not provided"
                })
                console.log(timestamp, " Cannot delete account. user_id isnt provided ");
            }
        } else {
            res.status(401).send({
                success: false,
                message: "UNATHORIZED ADMIN ONLY"
            })
            console.log(timestamp, " cannot delete account. unauthorized ")
        }


    }
    , getRole: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.role_id = 4) {
            let queryGetAdmin = 'SELECT * FROM `m_role`'

            dbHots.query(queryGetAdmin, (err, results) => {
                if (err) {
                    res.status(500).send({
                        success: false,
                        err
                    });
                    console.log(timestamp, " error admin-getRole", err);
                } else {
                    res.status(200).send({
                        success: true,
                        results
                    });
                    console.log(timestamp, " admin-getRole success");
                }
            })

        } else {
            res.status(401).send({
                success: false,
                message: "Unauthorized. ADMIN ONLY"
            });
            console.log(timestamp, " admin-getRole Unauthorized");
        }

    }
    , changeActive: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.role_id = 4) {
            if (req.params.user_id) {

                let queryGetLatestStatus = `SELECT active, user_id  FROM  user  u WHERE user_id = ?`;
                let paramGetLatestStatus = [req.params.user_id];

                dbHots.execute(queryGetLatestStatus, paramGetLatestStatus, (err, results) => {

                    let changeStatus = results[0].active === 1 ? 0 : 1

                    let isUser_idExist = results[0].user_id;

                    if (isUser_idExist) {
                        let queryChangeStatus = `UPDATE user 
                                                SET active = ?
                                                WHERE user_id = ?;`

                        let paramChangeStatus = [changeStatus, isUser_idExist]

                        dbHots.execute(queryChangeStatus, paramChangeStatus, (err) => {

                            if (err) {

                                res.status(500).send({
                                    success: false,
                                    message: err
                                });
                                console.log(timestamp, " admin-change_active error", err);

                            } else {

                                res.status(200).send({
                                    success: true,
                                    message: "successfully change status"
                                });
                                console.log(timestamp, " admin-change_active success");

                            }
                        })

                    } else {
                        //user_id is not exist
                        res.status(200).send({
                            success: false,
                            message: "user_id is not exist"
                        });
                        console.log(timestamp, " admin-change_active user_id is not provided");
                    }


                })

            } else {
                res.status(200).send({
                    success: false,
                    message: "user_id is not provided"
                });
                console.log(timestamp, " admin-change_active user_id is not provided");
            }
        } else {
            res.status(401).send({
                success: false,
                message: "Unauthorized. ADMIN ONLY"
            });
            console.log(timestamp, " admin-change_active UNAUTHORIZED");
        }

    }
    , getDepartment: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.role_id = 4) {

            queryGetDepartment = `SELECT * FROM m_department d`

            dbHots.query(queryGetDepartment, (err, results) => {
                if (err) {
                    res.status(500).send({
                        success: false,
                        message: err
                    });
                    console.log(timestamp, " HOTS admin-get departmenet ", err);
                } else {
                    res.status(200).send({
                        success: true,
                        message: "successfuly get department",
                        data: results
                    });
                    console.log(timestamp, " HOTS admin-get departmenet ", err);
                }
            })

        } else {
            res.status(401).send({
                success: false,
                message: "Unauthorized. ADMIN ONLY"
            });
            console.log(timestamp, " HOTS admin-get departmenet UNAUTHORIZED");
        }
    }
    , getTeam: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        if (req.dataToken.role_id = 4) {

            queryGetDepartment = `
                            SELECT 
                            t.*,
                            tm.*,
                            u.firstname,
                            u.lastname 
                            FROM 
                                m_team t
                            LEFT JOIN
                                m_team_member tm
                            ON
                                t.team_id = tm.team_id
                            LEFT JOIN
                                user u
                            ON
                                tm.user_id = u.user_id
                            WHERE 
                                tm.user_id IS NOT NULL 

            `

            dbHots.query(queryGetDepartment, (err, results) => {
                if (err) {
                    res.status(500).send({
                        success: false,
                        message: err
                    });
                    console.log(timestamp, " HOTS admin-get departmenet ", err);
                } else {
                    res.status(200).send({
                        success: true,
                        message: "successfuly get department",
                        data: results
                    });
                    console.log(timestamp, " HOTS admin-get departmenet ", err);
                }
            })

        } else {
            res.status(401).send({
                success: false,
                message: "Unauthorized. ADMIN ONLY"
            });
            console.log(timestamp, " HOTS admin-get departmenet UNAUTHORIZED");
        }
    }
    , getAllTicket: async (req, res) => {
        const date = new Date();
        const timestamp =
            redColor +
            date.toLocaleDateString("id") +
            " " +
            date.toLocaleTimeString("id") +
            " : ";

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = (page - 1) * limit;

        // ADMIN ONLY (role_id = 4)
        if (req.dataToken.role_id !== 4) {
            console.log(timestamp, "getAllTicket UNAUTHORIZED ADMIN ONLY");
            return res.status(401).send({
                success: false,
                message: "UNAUTHORIZED — ADMIN ONLY",
            });
        }

        // ==========================================================================
        // 🔥 MAIN QUERY (Engine v4 compatible)
        // ==========================================================================
        const query = `
            SELECT
                t.ticket_id,
                DATE_FORMAT(t.created_at, '%d/%m/%Y %H:%i') AS creation_date,
    
                s.service_id,
                s.service_name,
    
                t.workflow_level AS approval_level,
    
                ts.status_name AS status,
                ts.color_hex AS color,
    
                t.updated_at AS last_update,
                t.reject_reason AS reason,
                t.fulfilment_comment,
    
                /* Dynamic active assignments */
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'assigned_type', a.assigned_type,
                            'assigned_id', a.assigned_id,
                            'assigned_name', (
                                SELECT CONCAT(u2.firstname, ' ', u2.lastname)
                                FROM user u2 WHERE u2.user_id = a.assigned_id
                            ),
                            'assigned_at', a.assigned_at,
                            'assigned_by', a.assigned_by,
                            'assignment_status', a.assignment_status
                        )
                    )
                    FROM t_ticket_assignment a
                    WHERE a.ticket_id = t.ticket_id
                      AND a.assignment_status = 'active'
                ) AS active_assignments,
    
                /* Approval flow for UI */
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'actor_id', e.actor_id,
                            'actor_name', CONCAT(u3.firstname, ' ', u3.lastname),
                            'approval_order', e.approval_order,
                            'status', e.status,
                            'note', e.note
                        )
                    )
                    FROM t_ticket_event e
                    LEFT JOIN user u3 ON u3.user_id = e.actor_id
                    WHERE e.ticket_id = t.ticket_id
                    ORDER BY e.approval_order
                ) AS list_approval
    
            FROM t_ticket t
            LEFT JOIN m_service s        ON s.service_id = t.service_id
            LEFT JOIN m_ticket_status ts ON ts.status_id = t.status_id
            LEFT JOIN user u             ON u.user_id = t.created_by
    
            ORDER BY t.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        // ==========================================================================
        // 🔥 COUNT QUERY
        // ==========================================================================
        const countQuery = `
            SELECT COUNT(*) AS total_count
            FROM t_ticket
        `;

        try {
            const [[countRow]] = await dbHots.promise().query(countQuery);
            const totalData = countRow.total_count;
            const totalPage = Math.ceil(totalData / limit);

            const [rows] = await dbHots.promise().query(query);

            console.log(timestamp, "getAllTicket success!");

            return res.status(200).send({
                success: true,
                totalData,
                totalPage,
                page,
                data: rows,
            });
        } catch (err) {
            console.log(timestamp, "Error getAllTicket!", err);
            return res.status(500).send({
                success: false,
                message: "ERROR — " + err.message,
                error: err,
            });
        }
    }


    , getAllWorkFlow: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';


        if (req.dataToken.role_id = 4) {

            let getAllWorkFlow = ` 
            SELECT
               *
            FROM
                user u
            LEFT JOIN m_workflow w ON
                u.user_id = w.user_id
            `;
            // + desc + find;

            dbHots.execute(getAllWorkFlow, (err, results) => {

                if (err) {

                    res.status(500).send({ success: false, message: err });
                    console.log(timestamp + "Error getAllWorkFlow !", err)

                } else {
                    if (results[0]) {

                        let packet = results.slice(startIndex, endIndex)
                        let totalDataLength = results.length
                        let totalPage = Math.round(results.length / limit)

                        res.status(200).send({ packet, totalPage, totalDataLength, page });
                        console.log(timestamp + " getAllWorkFlow success !")

                    } else {

                        let packet = []
                        let totalDataLength = 0
                        let totalPage = 0

                        res.status(200).send({ packet, totalPage, totalDataLength, page });
                        console.log(timestamp + " getAllWorkFlow success no data!")
                    }
                }

            })

        } else {
            res.status(401).send({
                success: false,
                message: "getAllTicket UNATHORIZED ADMIN ONLY"
            })
            console.log(timestamp, "getAllTicket UNATHORIZED ADMIN ONLY")
        }


    }
    , getTeambydepartment: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        let paramGetAccountData = [req.params.department_id]

        if (req.dataToken.role_id = 4) {

            queryGetDepartment = `
                            SELECT 
                            t.*,
                            tm.*,
                            u.firstname,
                            u.lastname 
                            FROM 
                                m_team t
                            LEFT JOIN
                                m_team_member tm
                            ON
                                t.team_id = tm.team_id
                            LEFT JOIN
                                user u
                            ON
                                tm.user_id = u.user_id
                                left join
                                m_department d
                                on
                                t.department_id = d.department_id
                            WHERE 
                                tm.user_id IS NOT NULL 
                            and
                            d.department_id = ${paramGetAccountData}
            `

            dbHots.query(queryGetDepartment, (err, results) => {
                if (err) {
                    res.status(500).send({
                        success: false,
                        message: err
                    });
                    console.log(timestamp, " HOTS admin-get Team ", err);
                } else {
                    res.status(200).send({
                        success: true,
                        message: "successfuly get department",
                        data: results
                    });
                    console.log(timestamp, " HOTS admin-get Team ", paramGetAccountData);
                }
            })

        } else {
            res.status(401).send({
                success: false,
                message: "Unauthorized. ADMIN ONLY"
            });
            console.log(timestamp, " HOTS admin-get Team UNAUTHORIZED");
        }
    },
    getAccountbydepartment: async (req, res) => {

        let date = new Date();
        let timestamp = redColor + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        //untuk pagination
        let page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
        let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 9999;
        let desc = req.query.desc ? `order by u.uid ASC ` : `order by u.uid DESC`;
        let find = req.query.find ? ` AND u.uid LIKE '%${req.query.find}%'   ` : ''

        let paramGetAccountData = [req.params.department_id]


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        if (req.dataToken.role_id = 4) {

            let queryGetAccount = ` 
            SELECT
                u.user_id, 
                u.firstname,
                u.lastname,
                u.uid,
                u.last_pswd_changed,
                u.active,
                u.email,
                u.nik,
                u.phone,
                u.grade_id,
                r.role_name,
                d.department_name,  
                u.superior_id 
            FROM
                user u
            LEFT JOIN m_role r ON
                u.role_id = r.role_id 
            LEFT JOIN m_department d ON 
                u.department_id = d.department_id
            WHERE r.role_id IN (1,2,4) 
            and
            d.department_id = ${paramGetAccountData}           
            `+ desc + find;

            dbHots.execute(queryGetAccount, (err, results) => {

                if (err) {

                    res.status(500).send({ success: false, message: err });
                    console.log(timestamp + "Error getAccount !", err)

                } else {
                    if (results[0]) {

                        let packet = results.slice(startIndex, endIndex)
                        let totalDataLength = results.length
                        let totalPage = Math.round(results.length / limit)

                        res.status(200).send({ success: true, packet, totalPage, totalDataLength, page });
                        console.log(timestamp + " getAccount success !")

                    } else {

                        let packet = []
                        let totalDataLength = 0
                        let totalPage = 0

                        res.status(200).send({ success: true, packet, totalPage, totalDataLength, page });
                        console.log(timestamp + " getAccount success no data!")
                    }
                }

            })

        } else {
            res.status(401).send({
                success: false,
                message: "UNATHORIZED ADMIN ONLY"
            })
        }


    },



}