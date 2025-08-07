const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require("../../config/db");

const user_controller = {
    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const rows = await dbHots.execute(`
            SELECT u.*, d.department_name as department_name, r.role_name as role_name 
            FROM user u
            LEFT JOIN m_department d ON u.department_id = d.department_id
            LEFT JOIN m_role r ON u.role_id = r.role_id
            WHERE u.finished_date IS NULL
            ORDER BY u.registration_date DESC
          `);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error.message
            });
        }
    },


    // Get users by department
    getUsersByDepartment: async (req, res) => {
        try {
            const { departmentId } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT u.*, r.role_name as role_name 
                FROM user u
                LEFT JOIN m_role r ON u.role_id = r.role_id
                WHERE u.department_id = ? AND u.finished_date IS NULL
                ORDER BY u.name ASC
            `, [departmentId]);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching department users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch department users',
                error: error.message
            });
        }
    },

    // Create user
    createUser: async (req, res) => {
        try {
            const { name, email, password, role_id, department_id, phone, position } = req.body;
            const connection = await dbHots();

            const [result] = await connection.execute(`
                INSERT INTO user (name, email, password, role_id, department_id, phone, position, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [name, email, password, role_id, department_id, phone, position, req.userId]);

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error.message
            });
        }
    },

    // Get user by ID
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT u.*, d.department_name as department_name, r.role_name as role_name 
                FROM user u
                LEFT JOIN m_department d ON u.department_id = d.department_id
                LEFT JOIN m_role r ON u.role_id = r.role_id
                WHERE u.id = ? AND u.finished_date IS NULL
            `, [id]);

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user',
                error: error.message
            });
        }
    },

    // Update user
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role_id, department_id, phone, position, status } = req.body;
            const connection = await dbHots();

            const [result] = await connection.execute(`
                UPDATE user 
                SET name = ?, email = ?, role_id = ?, department_id = ?, phone = ?, position = ?, status = ?, updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [name, email, role_id, department_id, phone, position, status, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'User updated successfully'
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message
            });
        }
    },

    // Delete user (soft delete)
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();

            const [result] = await connection.execute(`
                UPDATE user 
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message
            });
        }
    },

    // Get user projects
    getUserProjects: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT p.*, pm.role as member_role
                FROM t_project p
                JOIN t_project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = ? AND p.deleted_at IS NULL
                ORDER BY p.created_at DESC
            `, [id]);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching user projects:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user projects',
                error: error.message
            });
        }
    },

    // Get user tasks
    getUserTasks: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT t.*, p.name as project_name
                FROM t_task t
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE t.assigned_to = ? AND t.deleted_at IS NULL
                ORDER BY t.due_date ASC
            `, [id]);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching user tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user tasks',
                error: error.message
            });
        }
    },

    // Get user teams
    getUserTeams: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT t.*, tm.role as member_role
                FROM t_team t
                JOIN t_team_members tm ON t.id = tm.team_id
                WHERE tm.user_id = ? AND t.deleted_at IS NULL
                ORDER BY t.name ASC
            `, [id]);

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

    // Get user performance
    getUserPerformance: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();

            // Get task completion stats
            const [taskStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
                    SUM(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks
                FROM t_task 
                WHERE assigned_to = ? AND deleted_at IS NULL
            `, [id]);

            // Get time tracking stats
            const [timeStats] = await connection.execute(`
                SELECT 
                    SUM(hours_logged) as total_hours_logged,
                    COUNT(*) as total_time_entries
                FROM t_time_tracking 
                WHERE user_id = ? AND DATE(logged_date) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `, [id]);

            res.status(200).json({
                success: true,
                data: {
                    tasks: taskStats[0],
                    time_tracking: timeStats[0]
                }
            });
        } catch (error) {
            console.error('Error fetching user performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user performance',
                error: error.message
            });
        }
    },

    // Get user workload
    getUserWorkload: async (req, res) => {
        try {
            const { id } = req.params;
            const connection = await dbHots();

            const [rows] = await connection.execute(`
                SELECT 
                    p.name as project_name,
                    COUNT(t.id) as task_count,
                    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                    SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) as high_priority_count
                FROM t_project p
                LEFT JOIN t_task t ON p.id = t.project_id AND t.assigned_to = ? AND t.deleted_at IS NULL
                JOIN t_project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = ? AND p.deleted_at IS NULL
                GROUP BY p.id, p.name
                ORDER BY task_count DESC
            `, [id, id]);

            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching user workload:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user workload',
                error: error.message
            });
        }
    }
};

module.exports = user_controller;