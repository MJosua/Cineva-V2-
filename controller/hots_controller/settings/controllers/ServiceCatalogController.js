const { dbHots } = require("../../../../config/db");

let yellowTerminal = "\x1b[33m";

/**
 * ServiceCatalogController
 * Handles Service Master, Categories, and Widgets
 */
module.exports = {
    getservice: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';
        let user_id = req.dataToken.user_id;

        const queryGetRole = `SELECT u.role_id FROM user u WHERE u.user_id = ? AND u.active = 1 LIMIT 1`;

        dbHots.execute(queryGetRole, [user_id], (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            if (!results1.length) return res.status(501).send({ success: false, message: 'Role is not set!' });

            const role_id = results1[0].role_id;
            let queryGetMenu = `
                SELECT s.*, wg.name as workflow_group_name
                FROM m_service s
                LEFT JOIN hots.m_service_workflow wg ON s.service_id = wg.workflow_id
            `;

            if (role_id !== 4) queryGetMenu += ` WHERE active = 1`;

            dbHots.execute(queryGetMenu, [role_id], (err2, results2) => {
                if (err2) return res.status(502).send({ success: false, message: err2 });
                if (!results2.length) return res.status(404).send({ success: false, message: 'Menu not found!' });
                res.status(200).send({ success: true, message: "GET MENU SUCCESS", data: results2 });
            });
        });
    },

    getserviceById: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        try {
            const service_id = req.params.service_id;
            if (!service_id) return res.status(400).send({ success: false, message: 'Service ID is required' });

            const queryGetService = `
                SELECT s.*, wg.name as workflow_group_name
                FROM m_service s
                LEFT JOIN hots.m_service_workflow wg ON s.service_id = wg.workflow_id
                WHERE s.service_id = ?
            `;
            const [serviceResults] = await dbHots.promise().query(queryGetService, [service_id]);
            if (!serviceResults.length) return res.status(404).send({ success: false, message: 'Service not found!' });

            const serviceData = serviceResults[0];
            const queryGetTriggers = `SELECT trigger_id, service_id, trigger_name, trigger_config, active, created_at, updated_at
                FROM m_service_triggers WHERE service_id = ?`;
            const [triggersResults] = await dbHots.promise().query(queryGetTriggers, [service_id]);

            const triggers = triggersResults.map(trigger => ({
                ...trigger,
                trigger_config: typeof trigger.trigger_config === 'string' ? JSON.parse(trigger.trigger_config) : trigger.trigger_config
            }));

            let workflowDefinition = null;
            try {
                const [workflowResults] = await dbHots.promise().query(`SELECT definition FROM m_service_workflow WHERE workflow_id = ?`, [service_id]);
                if (workflowResults.length && workflowResults[0].definition) {
                    workflowDefinition = typeof workflowResults[0].definition === 'string' ? JSON.parse(workflowResults[0].definition) : workflowResults[0].definition;
                }
            } catch (e) {
                console.log('No workflow definition found for service:', service_id);
            }

            res.status(200).send({ success: true, message: "GET SERVICE BY ID SUCCESS", data: { ...serviceData, triggers, workflow_definition: workflowDefinition } });
        } catch (err) {
            res.status(500).send({ success: false, message: err.message });
        }
    },

    getserviceCategory: (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        dbHots.execute(`SELECT * FROM m_service_category`, (err2, results2) => {
            if (err2) return res.status(502).send({ success: false, message: err2 });
            if (!results2.length) return res.status(404).send({ success: false, message: 'Service category not found!' });
            res.status(200).send({ success: true, message: "GET SERVICE CATEGORY SUCCESS", data: results2 });
        });
    },

    getAllServices: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        try {
            const [services] = await dbHots.promise().query(`
                SELECT hots.m_service.*, m_service_workflow.workflow_id AS workflow_group_id, m_service_workflow.name AS workflow_group_name
                FROM hots.m_service LEFT JOIN m_service_workflow ON hots.m_service.service_id  = m_service_workflow.workflow_id
                WHERE hots.m_service.finished_date IS NULL ORDER BY hots.m_service.service_name
            `);
            res.status(200).json({ success: true, data: services });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getActiveServices: async (req, res) => {
        try {
            const [services] = await dbHots.promise().query(`SELECT * FROM hots.m_service WHERE active = 1 AND finished_date IS NULL ORDER BY service_name`);
            res.status(200).json({ success: true, data: services });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getInactiveServices: async (req, res) => {
        try {
            const [services] = await dbHots.promise().query(`SELECT * FROM hots.m_service WHERE active = 0 AND finished_date IS NULL ORDER BY service_name`);
            res.status(200).json({ success: true, data: services });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    toggleServiceStatus: async (req, res) => {
        let user_id = req.dataToken.user_id;
        const status = parseInt(req.params.status || req.body.status);
        const service_id = parseInt(req.params.service_id || req.body.service_id);
        const new_status = status === 1 ? 0 : 1;
        try {
            await dbHots.promise().query(`UPDATE hots.m_service SET active = ? WHERE service_id = ?`, [new_status, service_id]);
            res.status(200).json({ success: true, message: "Service status updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    insertupdateServiceCatalog: async (req, res) => {
        try {
            const { service_id, category_id, service_name, service_description, approval_level, image_url, nav_link, active = 1, team_id, api_endpoint, form_json } = req.body;
            const finalServiceId = service_id || null;
            const query = `
                INSERT INTO m_service (service_id, category_id, service_name, service_description, approval_level, image_url, nav_link, active, team_id, api_endpoint, form_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), service_name = VALUES(service_name), service_description = VALUES(service_description),
                    approval_level = VALUES(approval_level), image_url = VALUES(image_url), nav_link = VALUES(nav_link), active = VALUES(active),
                    team_id = VALUES(team_id), api_endpoint = VALUES(api_endpoint), form_json = VALUES(form_json)
            `;
            await dbHots.promise().query(query, [finalServiceId, category_id, service_name, service_description, approval_level, image_url, nav_link, active, team_id, api_endpoint, JSON.stringify(form_json)]);
            res.status(200).json({ success: true, message: 'Service catalog entry upserted successfully', service_id });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updatewidget: async (req, res) => {
        try {
            const { widget_ids } = req.body;
            const { service_id } = req.params;
            await dbHots.promise().query(`UPDATE m_service SET widget = ? WHERE service_id = ?`, [JSON.stringify(widget_ids), service_id]);
            res.status(200).json({ success: true, message: 'Service catalog entry upserted successfully', service_id });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteServiceCatalog: async (req, res) => {
        try {
            const { service_id } = req.params;
            const [result] = await dbHots.promise().query('UPDATE m_service SET active = 0 WHERE service_id = ?', [service_id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Service not found" });
            res.status(200).json({ success: true, message: "Service deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getcategory: (req, res) => {
        dbHots.execute(`SELECT * FROM m_service`, (err1, results1) => {
            if (err1) return res.status(500).send({ success: false, message: err1 });
            res.status(200).send({ success: true, message: "GET service category SUCCESS", data: results1 });
        });
    }
};
