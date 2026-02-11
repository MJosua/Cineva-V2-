const { dbHots } = require("../../../../config/db");

let yellowTerminal = "\x1b[33m";

/**
 * WorkflowConfigController
 * Handles Workflow Groups, Steps, Instances, and Step Executions
 */
module.exports = {
    getAllWorkflowGroups: async (req, res) => {
        try {
            const [result] = await dbHots.promise().query(`SELECT * FROM hots.m_service_workflow ORDER BY name`);
            res.status(200).json({ data: result, success: true, message: "Service get workflow groups success" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createWorkflowGroup: async (req, res) => {
        const { name, description, category_ids } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_service_workflow (name, description, category_ids, created_date, updated_date, is_active)
                VALUES (?, ?, ?, NOW(), NOW(), 1)
            `, [name, description, JSON.stringify(category_ids)]);
            res.status(201).json({ data: { id: result.insertId, name, description, category_ids }, success: true, message: "Workflow group created successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateWorkflowGroup: async (req, res) => {
        const { id } = req.params;
        const { name, description, category_ids } = req.body;
        try {
            await dbHots.promise().query(`UPDATE hots.m_service_workflow SET name = ?, description = ?, category_ids = ? WHERE id = ?`, [name, description, JSON.stringify(category_ids), id]);
            res.status(200).json({ success: true, message: "Workflow group updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteWorkflowGroup: async (req, res) => {
        const { id } = req.params;
        try {
            await dbHots.promise().query(`UPDATE hots.m_service_workflow SET finished_date = NOW(), is_active = 0 WHERE id = ? AND finished_date IS NULL`, [id]);
            res.status(200).json({ success: true, message: "Workflow group deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getWorkflowSteps: async (req, res) => {
        const { workflow_group_id } = req.params;
        try {
            const [rows] = await dbHots.promise().query(`
                SELECT step_id, workflow_group_id, step_order, step_type, assigned_value, description, is_active,
                    creation_date as created_at, updated_at, finished_date
                FROM hots.t_workflow_step WHERE workflow_group_id = ? AND finished_date IS NULL ORDER BY step_order ASC
            `, [workflow_group_id]);
            res.status(200).json({ success: true, message: "Workflow steps retrieved successfully", data: rows });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createWorkflowStep: async (req, res) => {
        const { workflow_group_id, step_order, step_type, assigned_value, description } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.t_workflow_step (workflow_group_id, step_order, step_type, assigned_value, description, is_active, creation_date, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
            `, [workflow_group_id, step_order, step_type, assigned_value, description]);
            res.status(200).json({ success: true, message: "Workflow step created successfully", data: { step_id: result.insertId, workflow_group_id, step_order, step_type, assigned_value, description, is_active: true } });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    updateWorkflowStep: async (req, res) => {
        const { id } = req.params;
        const { step_order, step_type, assigned_value, description, is_active } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                UPDATE hots.t_workflow_step SET step_order = ?, step_type = ?, assigned_value = ?, description = ?, is_active = ?, updated_at = NOW()
                WHERE step_id = ? AND finished_date IS NULL
            `, [step_order, step_type, assigned_value, description, is_active, id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Workflow step not found or already finished" });
            res.status(200).json({ success: true, message: "Workflow step updated successfully", data: { step_id: id, step_order, step_type, assigned_value, description, is_active } });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteWorkflowStep: async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await dbHots.promise().query(`UPDATE hots.t_workflow_step SET finished_date = NOW(), is_active = 0, updated_at = NOW() WHERE step_id = ? AND finished_date IS NULL`, [id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Workflow step not found or already deleted" });
            res.status(200).json({ success: true, message: "Workflow step deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getWorkflowInstances: async (req, res) => {
        try {
            const [result] = await dbHots.promise().query(`
                SELECT wi.*, wg.name as workflow_group_name, u.firstname as created_by_firstname, u.lastname as created_by_lastname, mt.team_name
                FROM hots.t_workflow_instances wi
                LEFT JOIN hots.m_service_workflow wg ON wi.workflow_group_id = wg.workflow_id
                LEFT JOIN hots.user u ON wi.created_by_user_id = u.user_id
                LEFT JOIN hots.m_team mt ON wi.team_id = mt.team_id ORDER BY wi.creation_date DESC
            `);
            res.status(200).json({ data: result, success: true, message: "Service get workflow instances success" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    createWorkflowInstance: async (req, res) => {
        let user_id = req.dataToken.user_id;
        const { workflow_group_id, order_id, team_id, plant_id, description } = req.body;
        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.t_workflow_instances (workflow_group_id, order_id, current_step_order, status, team_id, plant_id, description, creation_date, created_by_user_id)
                VALUES (?, ?, 1, 'pending', ?, ?, ?, NOW(), ?)
            `, [workflow_group_id, order_id, team_id, plant_id, description, user_id]);
            res.status(201).json({ data: { workflow_id: result.insertId, workflow_group_id, order_id, current_step_order: 1, status: 'pending', team_id, plant_id, description, created_by_user_id: user_id }, success: true, message: "Workflow instance created successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getWorkflowStepExecutions: async (req, res) => {
        const { workflow_id } = req.params;
        try {
            const [result] = await dbHots.promise().query(`
                SELECT wse.*, assigned_user.firstname as assigned_firstname, assigned_user.lastname as assigned_lastname, action_user.firstname as action_firstname, action_user.lastname as action_lastname
                FROM hots.t_workflow_step_executions wse
                LEFT JOIN hots.user assigned_user ON wse.assigned_user_id = assigned_user.user_id
                LEFT JOIN hots.user action_user ON wse.action_by_user_id = action_user.user_id
                WHERE wse.workflow_id = ? ORDER BY wse.step_order
            `, [workflow_id]);
            res.status(200).json({ data: result, success: true, message: "Service get workflow step executions success" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};
