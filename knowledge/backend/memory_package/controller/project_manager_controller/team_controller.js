const { dbQueryHots } = require('../../config/db');

const team_controller = {
    // Get all teams
    getAllTeams: async (req, res) => {
        try {
            const { department_id } = req.params;
            const connection = await dbQueryHots();

            let query = `
                SELECT t.*, d.name as department_name,
                    (SELECT COUNT(*) FROM t_team_members WHERE team_id = t.id) as member_count
                FROM t_team t
                LEFT JOIN t_department d ON t.department_id = d.id
                WHERE t.deleted_at IS NULL
            `;
            const params = [];

            if (department_id) {
                query += ` AND t.department_id = ?`;
                params.push(department_id);
            }

            query += ` ORDER BY t.created_at DESC`;

            const [rows] = await connection.execute(query, params);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch teams',
                error: error.message
            });
        }
    },

    // Get user teams
    getUserTeams: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbQueryHots();

            const [rows] = await connection.execute(`
                SELECT t.*, tm.role as member_role, d.name as department_name
                FROM t_team t
                JOIN t_team_members tm ON t.id = tm.team_id
                LEFT JOIN t_department d ON t.department_id = d.id
                WHERE tm.user_id = ? AND t.deleted_at IS NULL
                ORDER BY t.name ASC
            `, [user_id]);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching user teams:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user teams',
                error: error.message
            });
        }
    },

    // Create team
    createTeam: async (req, res) => {
        try {
            const { name, description, department_id, team_lead_id } = req.body;
            const connection = await dbQueryHots();

            const [result] = await connection.execute(`
                INSERT INTO t_team (name, description, department_id, team_lead_id, created_by)
                VALUES (?, ?, ?, ?, ?)
            `, [name, description, department_id, team_lead_id, req.userId]);

            res.status(201).json({
                success: true,
                message: 'Team created successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error creating team:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create team',
                error: error.message
            });
        }
    },

    // Get team detail
    getTeamDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbQueryHots();

            const [rows] = await connection.execute(`
                SELECT t.*, d.name as department_name, u.name as team_lead_name
                FROM t_team t
                LEFT JOIN t_department d ON t.department_id = d.id
                LEFT JOIN t_user u ON t.team_lead_id = u.id
                WHERE t.id = ? AND t.deleted_at IS NULL
            `, [id]);

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Team not found'
                });
            }

            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching team detail:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team detail',
                error: error.message
            });
        }
    },

    // Update team
    updateTeam: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, department_id, team_lead_id, status } = req.body;
            const connection = await dbQueryHots();

            const [result] = await connection.execute(`
                UPDATE t_team 
                SET name = ?, description = ?, department_id = ?, team_lead_id = ?, status = ?, updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [name, description, department_id, team_lead_id, status, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Team not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Team updated successfully'
            });
        } catch (error) {
            console.error('Error updating team:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update team',
                error: error.message
            });
        }
    },

    // Delete team and other methods...
    deleteTeam: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbQueryHots();

            const [result] = await connection.execute(`
                UPDATE t_team 
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);

            res.status(200).json({
                success: true,
                message: 'Team deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting team:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete team',
                error: error.message
            });
        }
    },

    getTeamMembers: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbQueryHots();

            const [rows] = await connection.execute(`
                SELECT tm.*, u.name, u.email, u.position
                FROM t_team_members tm
                JOIN t_user u ON tm.user_id = u.id
                WHERE tm.team_id = ? AND u.deleted_at IS NULL
            `, [id]);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team members',
                error: error.message
            });
        }
    },

    addTeamMember: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, role = 'member' } = req.body;
            const connection = await dbQueryHots();

            const [result] = await connection.execute(`
                INSERT INTO t_team_members (team_id, user_id, role, added_by)
                VALUES (?, ?, ?, ?)
            `, [id, user_id, role, req.userId]);

            res.status(201).json({
                success: true,
                message: 'Team member added successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to add team member',
                error: error.message
            });
        }
    },

    removeTeamMember: async (req, res) => {
        try {
            const { id, userId } = req.params;
            const connection = await dbQueryHots();

            await connection.execute(`
                DELETE FROM t_team_members 
                WHERE team_id = ? AND user_id = ?
            `, [id, userId]);

            res.status(200).json({
                success: true,
                message: 'Team member removed successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to remove team member',
                error: error.message
            });
        }
    }
};

module.exports = team_controller;