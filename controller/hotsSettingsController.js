const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require("../config/db");
// const cookieParser = require('cookie-parser');

let yellowTerminal = "\x1b[33m";

module.exports = {
    getmenu: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT u.role_id
        FROM user u
        WHERE u.user_id = ? AND u.active = 1
        LIMIT 1`;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Auth Role Error: ", err1);
                return;
            }

            if (!results1.length) {
                res.status(501).send({
                    success: false,
                    message: 'Role is not set!'
                });
                return;
            }

            const role_id = results1[0].role_id;

            // Query to get the menu based on the role
            const queryGetMenu = `
            SELECT *
            FROM menu
            `;

            if (role_id !== 4) {
                queryGetMenu += ` WHERE role_id = ${role_id} AND active = 1`;
            }

            dbHots.execute(queryGetMenu, [role_id], (err2, results2) => {
                if (err2) {
                    res.status(502).send({
                        success: false,
                        message: err2
                    });
                    console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                    return;
                }

                if (!results2.length) {
                    res.status(404).send({
                        success: false,
                        message: 'Menu not found!'
                    });
                    return;
                }
                res.status(200).send({
                    success: true,
                    message: "GET MENU SUCCESS",
                    data: results2 // include menu data in the response
                });
            });
        });
    },
    getservice: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT u.role_id
        FROM user u
        WHERE u.user_id = ? AND u.active = 1
        LIMIT 1`;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Auth Role Error: ", err1);
                return;
            }

            if (!results1.length) {
                res.status(501).send({
                    success: false,
                    message: 'Role is not set!'
                });
                return;
            }

            const role_id = results1[0].role_id;

            // Query to get the menu based on the role
            let queryGetMenu = `
            SELECT *
            FROM m_service
            `;

            if (role_id !== 4) {
                queryGetMenu += ` WHERE active = 1`;
            }

            dbHots.execute(queryGetMenu, [role_id], (err2, results2) => {
                if (err2) {
                    res.status(502).send({
                        success: false,
                        message: err2
                    });
                    console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                    return;
                }

                if (!results2.length) {
                    res.status(404).send({
                        success: false,
                        message: 'Menu not found!'
                    });
                    return;
                }
                res.status(200).send({
                    success: true,
                    message: "GET MENU SUCCESS",
                    data: results2 // include menu data in the response
                });
                console.log(timestamp, "GET MENU SUCCESS");
            });
        });
    },

    getmember: (req, res) => {
        const date = new Date();
        const timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString('id') + ' : ';

        const team_id = req.params.team_id;

        // Check if team_id is valid
        if (!team_id) {
            res.status(400).send({
                success: false,
                message: 'Invalid team ID!'
            });
            console.log(timestamp, "HOTS Member Fetch Error: Invalid team ID");
            return;
        }

        const queryGetMember = `
        select
        tm.*,
        CONCAT(u.firstname, ' ', u.lastname) as fullname
        from
            m_team_member tm
        join 
            user u on
            tm.user_id = u.user_id
        where
            tm.team_id = ?
            and 
            tm.team_leader = 0;
        `;

        dbHots.execute(queryGetMember, [team_id], (err, results) => {
            if (err) {
                res.status(502).send({
                    success: false,
                    message: 'Database query error',
                    error: err
                });
                console.log(timestamp, "HOTS Member Fetch Error: ", err);
                return;
            }

            if (!results.length) {
                res.status(405).send({
                    success: false,
                    message: 'No members found for the given team ID!'
                });
                console.log(timestamp, "GET MEMBER: No members found.");
                return;
            }

            res.status(200).send({
                success: true,
                message: "GET MEMBER SUCCESS",
                data: results // include member data in the response
            });
            console.log(timestamp, "GET MEMBER SUCCESS");
        });
    },

    getserviceactive: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu


        // Query to get the menu based on the role
        let queryGetMenu = `
            SELECT *
            FROM m_service
            where
            active = 1
            `;

        dbHots.execute(queryGetMenu, (err2, results2) => {
            if (err2) {
                res.status(502).send({
                    success: false,
                    message: err2
                });
                console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                return;
            }

            if (!results2.length) {
                res.status(404).send({
                    success: false,
                    message: 'Menu not found!'
                });
                return;
            }
            res.status(200).send({
                success: true,
                message: "GET MENU Active SUCCESS",
                data: results2 // include menu data in the response
            });
            console.log(timestamp, "GET MENU SUCCESS");
        });
        ;
    },

    getserviceinactive: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu


        // Query to get the menu based on the role
        let queryGetMenu = `
            SELECT *
            FROM m_service
            where
            active = 0
            `;

        dbHots.execute(queryGetMenu, (err2, results2) => {
            if (err2) {
                res.status(502).send({
                    success: false,
                    message: err2
                });
                console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                return;
            }

            if (!results2.length) {
                res.status(404).send({
                    success: false,
                    message: 'Menu not found!'
                });
                return;
            }
            res.status(200).send({
                success: true,
                message: "GET MENU In-Active SUCCESS",
                data: results2 // include menu data in the response
            });
            console.log(timestamp, "GET MENU SUCCESS");
        });
        ;
    },


    setserviceactivestatus: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let service_ids = req.body.service_ids; // Array of service IDs
        let nextStatus = req.body.nextStatus;
        // cari username dulu

        if (!Array.isArray(service_ids) || service_ids.length === 0) {
            return res.status(400).send({
                success: false,
                message: "Please Check the Selected Service"
            });
        }

        // Query to get the menu based on the role
        let queryGetMenu = `
        UPDATE m_service
        SET active = ?
        WHERE service_id IN (${service_ids.map(() => '?').join(', ')})
        `;

        let params = [nextStatus, ...service_ids];

        dbHots.execute(queryGetMenu, params, (err2, results2) => {
            if (err2) {
                console.log("queryGetMenu")
                console.log(nextStatus, service_id)

                res.status(502).send({
                    success: false,
                    message: err2
                });
                console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                return;
            }

            if (results2.affectedRows === 0) {
                res.status(404).send({
                    success: false,
                    message: 'Menu not found!'
                });
                return;
            }
            res.status(200).send({
                success: true,
                message: "GET MENU SUCCESS",
                data: results2 // include menu data in the response
            });
            console.log(timestamp, "Set Service Status nextStatus SUCCESS");
        });
        ;
    },

    getcategory: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT *
        FROM 
        m_service
        `;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get  service category Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET  service category   SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET  service category   SUCCESS");
            }
        });
    },


    getsuperior: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetSuperior = `
        SELECT
            u.superior_id,
            CONCAT(us.firstname, " ", us.lastname) AS manager,
            u.final_superior_id,
            CONCAT(uf.firstname, " ", uf.lastname) AS bod
        FROM
            user u
        LEFT JOIN
            user us ON us.user_id = u.superior_id
        LEFT JOIN
            user uf ON uf.user_id = u.final_superior_id
        WHERE
            u.user_id = ?
        `;

        dbHots.execute(queryGetSuperior, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get  Superior Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET  Superior   SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET  Superior   SUCCESS");
            }
        });
    },

    getcompletionstatus: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetData = `
        SELECT *
        FROM 
        m_ticket_status
        `;

        dbHots.execute(queryGetData, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get Completion Status Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET Completion Status  SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET Completion Status  SUCCESS");
            }
        });

    },

    getSRFPlant: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetData = `
        SELECT 
            *
        FROM 
            m_plant
        `;

        dbHots.execute(queryGetData, (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS getSRFPlant Status Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "getSRFPlant Status  SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "getSRFPlant Status  SUCCESS");
            }
        });

    },

    getSRFSampleCategory: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetData = `
        SELECT 
            *
        FROM 
            m_sample_category
        `;

        dbHots.execute(queryGetData, (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get getSRFSampleCategory Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET getSRFSampleCategory  SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET getSRFSampleCategory  SUCCESS");
            }
        });

    },

    getSRFDeliverTo: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        const queryGetData = `
        SELECT mc.company_id company_id, upper(mc.company_name) company_name FROM iod.map_resp_for_dist md LEFT JOIN iod.mst_team mt ON md.team_id = mt.team_id AND md.company_id = mt.company_id  
        LEFT JOIN iod.mst_team_member mtm ON mtm.team_id = mt.team_id AND mtm.company_id = mt.company_id LEFT JOIN iod.mst_employee me ON mtm.employee_id = me.employee_id
        LEFT JOIN user u ON me.employee_id = u.employee_id 
        LEFT JOIN iod.mst_company mc ON md.distributor_id = mc.company_id 
        WHERE u.user_id = ${user_id}
        UNION 
        SELECT 999998, 'SPIT IOD - Lt. 23' company_name
        UNION 
        SELECT 999999, upper('Kedutaan Besar Republik Indonesia (KBRI)') company_name
        ORDER BY 1 asc 
        `;

        dbHots.execute(queryGetData, (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Get getSRFSampleCategory Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "GET getSRFSampleCategory  SUCCESS",
                    data: results1 // include menu data in the response
                });
                console.log(timestamp, "GET getSRFSampleCategory  SUCCESS");
            }
        });


    },

    getservice_dataupdate: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        // cari username dulu
        const queryGetRole = `
        SELECT u.type_id, u.system_shortname
        FROM m_iod_system u`;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: err1
                });
                console.log(timestamp, "HOTS Auth Role Error: ", err1);
                return;
            } else {
                res.status(200).send({
                    success: true,
                    message: "success get data servcice_INdofood",
                    data: results1
                });
                console.log(timestamp, "HOTS Auth Role Error: ", err1);
                return;
            }


        });
    },


    /* 
     
    */

}