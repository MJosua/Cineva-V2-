const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require("../../config/db");
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
            SELECT 
                s.*,
                wg.name as workflow_group_name,
                wg.description as workflow_group_description
            FROM m_service s
            LEFT JOIN hots.m_workflow_groups wg 
            ON 
            s.m_workflow_groups = wg.id
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

    getserviceCategory: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        // Tidak perlu user_id kalau tidak digunakan
        // let user_id = req.dataToken.user_id;

        let queryGetMenu = `
            SELECT *
            FROM m_service_category
        `;

        dbHots.execute(queryGetMenu, (err2, results2) => {
            if (err2) {
                console.log(timestamp, "HOTS Menu Fetch Error: ", err2);
                return res.status(502).send({
                    success: false,
                    message: err2
                });
            }

            if (!results2.length) {
                return res.status(404).send({
                    success: false,
                    message: 'Service category not found!'
                });
            }

            console.log(timestamp, "GET SERVICE CATEGORY SUCCESS");
            return res.status(200).send({
                success: true,
                message: "GET SERVICE CATEGORY SUCCESS",
                data: results2
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

                return;
            }


        });
    },

    getpricingstructure_row: (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

        let user_id = req.dataToken.user_id

        const queryPricingStructureRow = `
        SELECT COALESCE(COUNT(*), 0) AS total_rows
        FROM t_ps_header
    `;

        dbHots.execute(queryPricingStructureRow, (err1, results1) => {
            if (err1) {
                res.status(500).send({
                    success: false,
                    message: 'Error retrieving pricing structure row count',
                    error: err1
                });
                console.error(`${timestamp} HOTS Auth Role Error:`, err1);
                return;
            }

            // Assuming results1 is an array and the count is in the first row
            const totalRows = results1[0]?.total_rows || 0;

            res.status(200).send({
                success: true,
                message: `Success fetching row data pricing structure for user ${user_id}`,
                data: totalRows
            });
            console.log(`${timestamp} Success fetching row data pricing structure for user ${user_id}. Total rows: ${totalRows}`);
        });
    },
    insertupdateServiceCatalog: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const {
                service_id,
                category_id,
                service_name,
                service_description,
                approval_level,
                image_url,
                nav_link,
                active = 1,
                team_id,
                api_endpoint,
                form_json,
                m_workflow_groups // ensure this is a column in your `m_service` table
            } = req.body;

            const finalServiceId = service_id || null;

            const query = `
                INSERT INTO m_service (
                    service_id, category_id, service_name, service_description,
                    approval_level, image_url, nav_link, active, team_id,
                    api_endpoint, form_json, m_workflow_groups
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    category_id = VALUES(category_id),
                    service_name = VALUES(service_name),
                    service_description = VALUES(service_description),
                    approval_level = VALUES(approval_level),
                    image_url = VALUES(image_url),
                    nav_link = VALUES(nav_link),
                    active = VALUES(active),
                    team_id = VALUES(team_id),
                    api_endpoint = VALUES(api_endpoint),
                    form_json = VALUES(form_json),
                    m_workflow_groups = VALUES(m_workflow_groups)
            `;

            const [result] = await dbHots.promise().query(query, [
                finalServiceId,
                category_id,
                service_name,
                service_description,
                approval_level,
                image_url,
                nav_link,
                active,
                team_id,
                api_endpoint,
                JSON.stringify(form_json), // ensure JSON safety
                m_workflow_groups
            ]);
            console.log("m_workflow_groups", m_workflow_groups)
            console.log(`${timestamp} Success insertupdateServiceCatalog for user ${user_id}`);

            res.status(200).json({
                success: true,
                message: 'Service catalog entry upserted successfully',
                service_id
            });
        } catch (err) {
            console.error("UPSERT ERROR", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updatewidget: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const {
                widget_ids
            } = req.body;
            const { service_id } = req.params;


            const query = `
                UPDATE m_service
                SET widget = ?
                WHERE service_id = ?
            `;

            const [result] = await dbHots.promise().query(query, [
                JSON.stringify(widget_ids),
                service_id,

            ]);
            console.log(`${timestamp} Success update widget for user ${user_id} for service ${service_id}`);

            res.status(200).json({
                success: true,
                message: 'Service catalog entry upserted successfully',
                service_id
            });
        } catch (err) {
            console.error("UPSERT ERROR", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteServiceCatalog: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const { service_id } = req.params;
            const [result] = await dbHots.promise().query('UPDATE m_service SET active = 0 WHERE service_id = ?', [service_id]);

            console.log("Trying to delete service with ID", service_id)
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Service not found" });
            }

            res.status(200).json({
                success: true,
                message: "Service deleted successfully"
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getAllUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
            select
                    *,
                    CASE WHEN u.finished_date IS NOT NULL THEN 1 ELSE 0 END as is_deleted
                from
                    hots.user u
                    left join
                    hots.m_team mt on 
                    u.department_id = mt.department_id 
                    left join 
                    hots.m_role mr on
                    u.role_id = mr.role_id
                    left join
                    hots.m_job_title mjt on
                    u.jobtitle_id = mjt.jobtitle_id
          `);

            console.log(`Trying to get all users success from ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result, // ✅ result is already the array of rows
                success: true,
                message: "Service getuser success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    getAllWorkflowGroups: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
               SELECT 
                  *
                FROM hots.m_workflow_groups
                ORDER BY name
            `);

            console.log(`Trying to get all workflow groups success from ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Service get workflow groups success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    createWorkflowGroup: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const { name, description, category_ids } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_workflow_groups 
                (name, description, category_ids, created_date, updated_date, is_active)
                VALUES (?, ?, ?, NOW(), NOW(), 1)
            `, [name, description, JSON.stringify(category_ids)]);

            console.log(`Workflow group created successfully by ${user_id} at ${timestamp}`);

            res.status(201).json({
                data: { id: result.insertId, name, description, category_ids },
                success: true,
                message: "Workflow group created successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    getWorkflowInstances: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT 
                    wi.*,
                    wg.name as workflow_group_name,
                    wg.description as workflow_group_description,
                    u.firstname as created_by_firstname,
                    u.lastname as created_by_lastname,
                    mt.team_name
                FROM hots.t_workflow_instances wi
                LEFT JOIN hots.m_workflow_groups wg ON wi.workflow_group_id = wg.id
                LEFT JOIN hots.user u ON wi.created_by_user_id = u.user_id
                LEFT JOIN hots.m_team mt ON wi.team_id = mt.team_id
                ORDER BY wi.creation_date DESC
            `);

            console.log(`Trying to get workflow instances success from ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Service get workflow instances success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    createWorkflowInstance: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const { workflow_group_id, order_id, team_id, plant_id, description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.t_workflow_instances 
                (workflow_group_id, order_id, current_step_order, status, team_id, plant_id, description, creation_date, created_by_user_id)
                VALUES (?, ?, 1, 'pending', ?, ?, ?, NOW(), ?)
            `, [workflow_group_id, order_id, team_id, plant_id, description, user_id]);

            console.log(`Workflow instance created successfully by ${user_id} at ${timestamp}`);

            res.status(201).json({
                data: {
                    workflow_id: result.insertId,
                    workflow_group_id,
                    order_id,
                    current_step_order: 1,
                    status: 'pending',
                    team_id,
                    plant_id,
                    description,
                    created_by_user_id: user_id
                },
                success: true,
                message: "Workflow instance created successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    getWorkflowStepExecutions: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { workflow_id } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT 
                    wse.*,
                    assigned_user.firstname as assigned_firstname,
                    assigned_user.lastname as assigned_lastname,
                    action_user.firstname as action_firstname,
                    action_user.lastname as action_lastname
                FROM hots.t_workflow_step_executions wse
                LEFT JOIN hots.user assigned_user ON wse.assigned_user_id = assigned_user.user_id
                LEFT JOIN hots.user action_user ON wse.action_by_user_id = action_user.user_id
                WHERE wse.workflow_id = ?
                ORDER BY wse.step_order
            `, [workflow_id]);

            console.log(`Trying to get workflow step executions success from ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Service get workflow step executions success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    getAllRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT 
                    role_id,
                    role_name,
                    role_description,
                    creation_date,
                    finished_date
                FROM hots.m_role 
                ORDER BY role_name ASC
            `);

            console.log(`Trying to get all roles success from ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Service get roles success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    createRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const { role_name, role_description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_role (role_name, role_description, creation_date) 
                VALUES (?, ?, NOW())
            `, [role_name, role_description]);

            console.log(`Role created successfully by ${user_id} at ${timestamp}`);

            res.status(201).json({
                data: { role_id: result.insertId, role_name, role_description },
                success: true,
                message: "Role created successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    updateRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const role_id = req.params.id;
        const { role_name, role_description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
                UPDATE hots.m_role 
                SET role_name = ?, role_description = ?
                WHERE role_id = ? AND finished_date IS NULL
            `, [role_name, role_description, role_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found or already deleted"
                });
            }

            console.log(`Role updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: { role_id, role_name, role_description },
                success: true,
                message: "Role updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    deleteRole: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        const role_id = req.params.id;

        try {
            // Check if role is being used by any users
            const [usageCheck] = await dbHots.promise().query(`
                SELECT COUNT(*) as count FROM hots.user WHERE role_id = ?
            `, [role_id]);

            if (usageCheck[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete role that is assigned to users"
                });
            }

            const [result] = await dbHots.promise().query(`
                UPDATE hots.m_role 
                SET finished_date = NOW() 
                WHERE role_id = ? AND finished_date IS NULL
            `, [role_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found or already deleted"
                });
            }

            console.log(`Role deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Role deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },


    getAllJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT 
                    jobtitle_id,
                    job_title,
                    department_id,
                    creation_date,
                    finished_date
                FROM 
                    hots.m_job_title 
                WHERE 
                    finished_date IS NULL OR finished_date = ''
                ORDER BY 
                    job_title ASC
            `);

            console.log(`Trying to get all job titles success from ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Service get job title success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    createJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { job_title, department_id } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.m_job_title 
            (job_title, department_id, creation_date) 
            VALUES (?, ?, NOW())
        `, [job_title, department_id]);

            console.log(`Job title created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: { jobtitle_id: result.insertId, job_title, department_id },
                success: true,
                message: "Job title created successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    updateJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { job_title, department_id } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
                UPDATE hots.m_job_title 
                SET job_title = ?, department_id = ?
                WHERE jobtitle_id = ?
            `, [job_title, department_id, id]);

            console.log(`Job title updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Job title updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    deleteJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        try {
            // Soft delete by setting finished_date
            const [result] = await dbHots.promise().query(`
                UPDATE hots.m_job_title 
                SET finished_date = NOW()
                WHERE jobtitle_id = ?
            `, [id]);

            console.log(`Job title deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Job title deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },


    // Create User
    createUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { firstname, lastname, uid, email, role_id, department_id, team_id, jobtitle_id, superior_id } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.user (firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id, registration_date, pswd)
            VALUES (?, ?, ?, ?, ?, ?, ?,  ?, NOW(), "Indofood01")
        `, [firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id]);

            console.log(`User created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "User created successfully",
                data: { user_id: result.insertId }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update User
    updateUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { firstname, lastname, uid, email, role_id, department_id, team_id, jobtitle_id, superior_id } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.user 
            SET firstname = ?, lastname = ?, uid = ?, email = ?, role_id = ?, 
                department_id = ?, jobtitle_id = ?, superior_id = ?
            WHERE user_id = ? AND finished_date IS NULL
        `, [firstname, lastname, uid, email, role_id, department_id, jobtitle_id, superior_id, id]);

            console.log(`User updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "User updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Delete User
    deleteUser: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.user 
            SET finished_date = NOW() 
            WHERE user_id = ? AND finished_date IS NULL
        `, [id]);

            console.log(`User deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },


    // Update Workflow Group
    updateWorkflowGroup: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { name, description, category_ids } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_workflow_groups
            SET name = ?, description = ?, category_ids = ?
            WHERE id = ?
        `, [name, description, JSON.stringify(category_ids), id]);

            console.log(`Workflow group updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Workflow group updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Delete Workflow Group
    deleteWorkflowGroup: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        console.log("user_id", user_id)
        const { id } = req.params;
        console.log(`Workflow group deleted request for ${id} `);

        try {
            const [result] = await dbHots.promise().query(`
          UPDATE hots.m_workflow_groups 
            SET 
            finished_date = NOW(),
            is_active = 0
            WHERE 
            id = ? 
            AND finished_date IS NULL;
        `, [id]);

            console.log(`Workflow group deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Workflow group deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get Workflow Steps
    // Get workflow steps by workflow group ID
    getWorkflowSteps: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { workflow_group_id } = req.params;

        try {
            const [rows] = await dbHots.promise().query(`
            SELECT 
                step_id,
                workflow_group_id,
                step_order,
                step_type,
                assigned_value,
                description,
                is_active,
                creation_date as created_at,
                updated_at,
                finished_date
            FROM hots.t_workflow_step 
            WHERE workflow_group_id = ? AND finished_date IS NULL
            ORDER BY step_order ASC
        `, [workflow_group_id]);

            console.log(`Workflow steps retrieved for group ${workflow_group_id} by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Workflow steps retrieved successfully",
                data: rows
            });
        } catch (err) {
            console.error(`Error retrieving workflow steps: ${err.message}`);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Create new workflow step
    createWorkflowStep: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { workflow_group_id, step_order, step_type, assigned_value, description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.t_workflow_step (
                workflow_group_id, 
                step_order, 
                step_type, 
                assigned_value, 
                description, 
                is_active,
                creation_date,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
        `, [workflow_group_id, step_order, step_type, assigned_value, description]);

            console.log(`Workflow step created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Workflow step created successfully",
                data: {
                    step_id: result.insertId,
                    workflow_group_id,
                    step_order,
                    step_type,
                    assigned_value,
                    description,
                    is_active: true
                }
            });
        } catch (err) {
            console.error(`Error creating workflow step: ${err.message}`);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update workflow step
    updateWorkflowStep: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { step_order, step_type, assigned_value, description, is_active } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.t_workflow_step 
            SET 
                step_order = ?,
                step_type = ?,
                assigned_value = ?,
                description = ?,
                is_active = ?,
                updated_at = NOW()
            WHERE step_id = ? AND finished_date IS NULL
        `, [step_order, step_type, assigned_value, description, is_active, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Workflow step not found or already finished"
                });
            }

            console.log(`Workflow step ${id} updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Workflow step updated successfully",
                data: {
                    step_id: id,
                    step_order,
                    step_type,
                    assigned_value,
                    description,
                    is_active
                }
            });
        } catch (err) {
            console.error(`Error updating workflow step: ${err.message}`);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Delete workflow step (soft delete by setting finished_date)
    deleteWorkflowStep: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.t_workflow_step 
            SET 
                finished_date = NOW(),
                is_active = 0,
                updated_at = NOW()
            WHERE step_id = ? AND finished_date IS NULL
        `, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Workflow step not found or already deleted"
                });
            }

            console.log(`Workflow step ${id} deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Workflow step deleted successfully"
            });
        } catch (err) {
            console.error(`Error deleting workflow step: ${err.message}`);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },





    // Create Job Title
    createJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { job_title_name, job_title_description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.m_job_title (job_title_name, job_title_description, creation_date)
            VALUES (?, ?, NOW())
        `, [job_title_name, job_title_description]);

            console.log(`Job title created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Job title created successfully",
                data: { job_title_id: result.insertId }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update Job Title
    updateJobTitle: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { job_title_name, job_title_description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_job_title 
            SET job_title_name = ?, job_title_description = ?
            WHERE jobtitle_id = ? AND finished_date IS NULL
        `, [job_title_name, job_title_description, id]);

            console.log(`Job title updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Job title updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },


    // Get All Services
    getAllServices: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [services] = await dbHots.promise().query(`
           SELECT
                hots.m_service.*,
                hots.m_service.m_workflow_groups AS workflow_group_id,
                m_workflow_groups.name AS workflow_group_name
                FROM
                hots.m_service
                LEFT JOIN m_workflow_groups ON hots.m_service.m_workflow_groups  = m_workflow_groups.id
                WHERE
                hots.m_service.finished_date IS NULL
                ORDER BY
                hots.m_service.service_name;

        `);

            console.log(`Services fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: services
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get Active Services
    getActiveServices: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [services] = await dbHots.promise().query(`
            SELECT * FROM hots.m_service 
            WHERE status = 'active' AND finished_date IS NULL 
            ORDER BY service_name
        `);

            console.log(`Active services fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: services
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get Inactive Services
    getInactiveServices: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [services] = await dbHots.promise().query(`
            SELECT * FROM hots.m_service 
            WHERE status = 'inactive' AND finished_date IS NULL 
            ORDER BY service_name
        `);

            console.log(`Inactive services fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: services
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Toggle Service Status
    toggleServiceStatus: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const status = parseInt(req.params.status || req.body.status);
        const service_id = parseInt(req.params.service_id || req.body.service_id);


        const new_status = status === 1 ? 0 : 1;
        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_service 
            SET active = ? 
            WHERE service_id = ? 
        `, [new_status, service_id]);

            console.log(`Service status updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Service status updated successfully"
            });
        } catch (err) {
            console.log("status", status)
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get all teams
    getAllTeams: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [teams] = await dbHots.promise().query(`
            SELECT team_id, team_name, department_id, creation_date 
            FROM hots.m_team 
            WHERE finished_date IS NULL 
            ORDER BY team_name
        `);

            console.log(`Teams fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: teams
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    getTeams: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [teams] = await dbHots.promise().query(`
                SELECT 
                    t.team_id,
                    t.team_name,
                    t.department_id,
                    d.department_name,
                    t.finished_date,
                    COUNT(tm.user_id) as member_count,
                    SUM(tm.team_leader) as leader_count,
                    CONCAT_WS(' ', u.firstname, u.lastname) AS head_fullname
                FROM hots.m_team t
                LEFT JOIN hots.m_department d ON t.department_id = d.department_id
                LEFT JOIN hots.m_team_member tm ON t.team_id = tm.team_id
                LEFT JOIN hots.user AS u ON u.user_id = tm.user_id
                GROUP BY t.team_id, t.department_id
                ORDER BY  t.team_id 
            `);

            console.log(`Teams fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: teams
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },


    // Get team members with leader status
    getTeamMembers: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { team_id } = req.params;

        try {
            const [members] = await dbHots.promise().query(`
                SELECT 
                    u.user_id,
                    u.firstname,
                    u.lastname,
                    u.email,
                    tm.team_leader,
                    mjt.job_title as job_title
                FROM hots.m_team_member tm
                JOIN hots.user u ON tm.user_id = u.user_id
                LEFT JOIN hots.m_job_title mjt ON u.jobtitle_id = mjt.jobtitle_id
                WHERE tm.team_id = ? AND tm.finished_date IS NULL AND u.finished_date IS NULL
                ORDER BY tm.team_leader DESC, u.firstname, u.lastname
            `, [team_id]);

            console.log(`Team members fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: members
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },


    // Get team leaders only
    getTeamLeaders: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { team_id } = req.params;

        try {
            const [leaders] = await dbHots.promise().query(`
            SELECT 
                tm.team_id,
                tm.team_name,
                u.user_id,
                u.firstname,
                u.lastname,
                u.uid,
                u.email,
                u.role_name
            FROM hots.m_team_member tm
            JOIN hots.user u ON u.user_id = tm.user_id
            WHERE tm.team_id = ? AND tm.team_leader = 1 AND tm.finished_date IS NULL
            ORDER BY u.firstname
        `, [team_id]);

            console.log(`Team leaders fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: leaders
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },





    deleteTeam: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
                UPDATE hots.m_team 
                SET finished_date = NOW() 
                WHERE team_id = ? AND finished_date IS NULL
            `, [id]);

            console.log(`Team deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Team deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    getDepartments: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;

        try {
            const [departments] = await dbHots.promise().query(`
            SELECT 
                d.department_id,
                d.department_name,
                d.department_shortname,
                d.department_head,
                d.description,
                COUNT(DISTINCT t.team_id) as team_count,
                COUNT(DISTINCT u.user_id) as user_count
            FROM hots.m_department d
            LEFT JOIN hots.m_team t ON d.department_id = t.department_id 
                AND t.finished_date IS NULL
            LEFT JOIN hots.user u ON d.department_id = u.department_id 
                AND u.finished_date IS NULL
            WHERE d.finished_date IS NULL
            GROUP BY d.department_id, d.department_name, d.department_shortname, d.department_head, d.description
            ORDER BY d.department_name
        `);

            console.log(`Departments fetched successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: departments
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    // Add Team Member
    addTeamMember: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const actor_user_id = req.dataToken.user_id;
        const { team_id, user_id, team_leader = 0 } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.m_team_member (team_id, user_id, team_leader, creation_date, updated_date)
            VALUES (?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
              team_leader = VALUES(team_leader),
              updated_date = NOW()
          `, [team_id, user_id, team_leader]);

            console.log(`Team member upserted by ${actor_user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Team member added or updated successfully",
                data: { affectedRows: result.affectedRows }
            });

        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update Team Member
    updateTeamLeader: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { team_leader } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_team_member 
            SET team_leader = ?, updated_date = NOW() 
            WHERE team_member_id = ? AND finished_date IS NULL
        `, [team_leader, id]);

            console.log(`Team member updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Team member updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Remove Team Member
    removeTeamMember: async (req, res) => {
        const date = new Date();
        const timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        const actor_user_id = req.dataToken.user_id;
        const { team_id, user_id } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
            DELETE FROM hots.m_team_member 
            WHERE team_id = ? AND user_id = ?
          `, [team_id, user_id]);

            console.log(`Team member ${user_id} removed from team ${team_id} by ${actor_user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Team member removed successfully",
                affectedRows: result.affectedRows
            });

        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get All Departments
    getAllDepartments: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        try {
            const [rows] = await dbHots.promise().query(`
            SELECT
                d.department_id,
                d.department_name,
                d.department_shortname,
                d.department_head,
                CONCAT_WS(' ', u.firstname, u.lastname) AS head_fullname,
                CASE WHEN d.finished_date IS NOT NULL THEN 1 ELSE 0 END as is_deleted,
                d.description,
                d.created_date
                FROM hots.m_department AS d
                LEFT JOIN hots.user AS u
                ON u.user_id = d.department_head
                ORDER BY d.department_name ASC;

        `);

            console.log(`Departments fetched successfully at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Create Department
    createDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { department_name, department_shortname, department_head, description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.m_department (
                department_name, 
                department_shortname, 
                department_head, 
                description, 
                created_date
            ) VALUES (?, ?, ?, ?, NOW())
        `, [department_name, department_shortname, department_head, description]);

            console.log(`Department created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Department created successfully",
                data: { id: result.insertId }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update Department
    updateDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { department_name, department_shortname, department_head, description, status } = req.body;
        const updatestatus = status === 'active' ? null : new Date();


        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_department 
            SET 
                department_name = ?, 
                department_shortname = ?, 
                department_head = ?, 
                description = ?,
                finished_date = ?,
                updated_date = NOW()
            WHERE department_id = ? AND finished_date IS NULL
        `, [department_name, department_shortname, department_head, description, updatestatus, id]);
            console.log(`Department updated successfully by ${user_id} at ${timestamp}`);
            console.log("updatestatus", updatestatus)

            res.status(200).json({
                success: true,
                message: "Department updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Delete Department
    deleteDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_department 
            SET finished_date = NOW() 
            WHERE department_id = ? AND finished_date IS NULL
        `, [id]);

            console.log(`Department deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Department deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Create Team
    createTeam: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { team_name, department_id, description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            INSERT INTO hots.m_team (team_name, department_id, description, created_date) 
            VALUES (?, ?, ?, NOW())
        `, [team_name, department_id, description]);

            console.log(`Team created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Team created successfully",
                data: { id: result.insertId }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },



    // Update Team
    updateTeam: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { team_name, department_id, description } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
            UPDATE hots.m_team 
            SET 
                team_name = ?, 
                department_id = ?, 
                description = ?,
                updated_date = NOW()
            WHERE team_id = ? AND finished_date IS NULL
        `, [team_name, department_id, description, id]);

            console.log(`Team updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Team updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },




    getTeamsByDepartment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;
        const { department_id } = req.params;

        try {
            const [teams] = await dbHots.promise().query(`
                SELECT 
                    t.team_id,
                    t.team_name,
                    t.team_shortname,
                    t.team_leader,
                    t.description,
                    t.department_id,
                    d.department_name,
                    u.firstname as leader_firstname,
                    u.lastname as leader_lastname,
                    COUNT(tm.user_id) as member_count
                FROM hots.m_team t
                LEFT JOIN hots.m_department d ON t.department_id = d.department_id
                LEFT JOIN hots.user u ON t.team_leader = u.user_id
                LEFT JOIN hots.m_team_member tm ON t.team_id = tm.team_id AND tm.finished_date IS NULL
                WHERE t.department_id = ? AND t.finished_date IS NULL
                GROUP BY t.team_id, t.team_name, t.team_shortname, t.team_leader, t.description, t.department_id, d.department_name, u.firstname, u.lastname
                ORDER BY t.team_name
            `, [department_id]);

            console.log(`Teams by department ${department_id} retrieved successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: teams,
                message: "Teams retrieved successfully"
            });
        } catch (err) {
            console.error(`Error getting teams by department: ${err.message} at ${timestamp}`);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },



    getmeetingroom: async (req, res) => {

        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        let user_id = req.dataToken.user_id;


        try {
            const [room] = await dbHots.promise().query(`
               SELECT
                t.ticket_id,
                MAX(CASE WHEN d.lbl_col = 'Meeting Room' THEN d.cstm_col END) AS room,
                MAX(CASE WHEN d.lbl_col = 'Time Start' THEN d.cstm_col END) AS start_time,
                MAX(CASE WHEN d.lbl_col = 'Time End' THEN d.cstm_col END) AS end_time,
                dpt.department_name AS booked_by,
                MAX(CASE WHEN d.lbl_col = 'partisipan' THEN d.cstm_col END) AS attendees,
                MAX(CASE WHEN d.lbl_col = 'date' THEN d.cstm_col END) AS date
                FROM t_ticket t
                LEFT JOIN t_ticket_detail d ON d.ticket_id = t.ticket_id
                left join user u on u.user_id = t.created_by
                left join m_department dpt on u.department_id = dpt.department_id
                WHERE t.service_id = 13
                GROUP BY t.ticket_id
                HAVING 
                STR_TO_DATE(MAX(CASE WHEN d.lbl_col = 'date' THEN d.cstm_col END), '%Y-%m-%d') BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 5 DAY)
                AND DAYOFWEEK(STR_TO_DATE(MAX(CASE WHEN d.lbl_col = 'date' THEN d.cstm_col END), '%Y-%m-%d')) NOT IN (1, 7)
                ORDER BY t.ticket_id DESC;

            `);

            console.log(`Room Widget API retrieved successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                data: room,
                message: "Teams retrieved successfully"
            });
        } catch (err) {
            console.error(`Error getting teams by department: ${err.message} at ${timestamp}`);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }



    },

    getmeetingroom_static: async (req, res) => {
        const currentDate = new Date();
        const timestamp = yellowTerminal + currentDate.toLocaleDateString('id') + ' ' + currentDate.toLocaleTimeString('id') + ' : ';
        const user_id = req.dataToken.user_id;
        let { date, room } = req.query;
    
        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Tanggal (date) harus disediakan dalam format YYYY-MM-DD"
            });
        }
    
        try {
            const query = `
                SELECT
                    t.ticket_id,
                    MAX(CASE WHEN d.lbl_col = 'Meeting Room' THEN d.cstm_col END) AS room,
                    MAX(CASE WHEN d.lbl_col = 'Time Start' THEN d.cstm_col END) AS start_time,
                    MAX(CASE WHEN d.lbl_col = 'Time End' THEN d.cstm_col END) AS end_time,
                    dpt.department_name AS booked_by,
                    MAX(CASE WHEN d.lbl_col = 'partisipan' THEN d.cstm_col END) AS attendees,
                    MAX(CASE WHEN d.lbl_col = 'date' THEN d.cstm_col END) AS date
                FROM t_ticket t
                LEFT JOIN t_ticket_detail d ON d.ticket_id = t.ticket_id
                LEFT JOIN user u ON u.user_id = t.created_by
                LEFT JOIN m_department dpt ON u.department_id = dpt.department_id
                WHERE t.service_id = 13
                GROUP BY t.ticket_id
                HAVING
                    MAX(CASE WHEN d.lbl_col = 'date' THEN d.cstm_col END) = ?
                    ${room ? "AND MAX(CASE WHEN d.lbl_col = 'Meeting Room' THEN d.cstm_col END) = ?" : ""}
                ORDER BY t.ticket_id DESC
            `;
    
            const params = [date];
            if (room) params.push(room);
    
            const [roomResult] = await dbHots.promise().query(query, params);
    
            console.log(`Room Widget API accessed by ${user_id} at ${timestamp}`);
    
            res.status(200).json({
                success: true,
                data: roomResult,
                message: "Meeting room bookings retrieved successfully"
            });
        } catch (err) {
            console.error(`Error in getmeetingroom_static: ${err.message} at ${timestamp}`);
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat mengambil data meeting room"
            });
        }
    },




    /* 
     
    */

}