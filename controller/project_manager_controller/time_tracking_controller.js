const { dbHots } = require('../../config/db');

const time_tracking_controller = {
    // Get task time entries
    getTaskTimeEntries: async (req, res) => {
        try {
            const { taskId } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT tt.*, u.name as user_name, t.title as task_title
                FROM t_time_tracking tt
                LEFT JOIN t_user u ON tt.user_id = u.id
                LEFT JOIN t_task t ON tt.task_id = t.id
                WHERE tt.task_id = ? AND tt.deleted_at IS NULL
                ORDER BY tt.logged_date DESC, tt.created_at DESC
            `, [taskId]);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching task time entries:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task time entries',
                error: error.message
            });
        }
    },

    // Log time entry
    logTimeEntry: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { hours_logged, description, logged_date } = req.body;
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                INSERT INTO t_time_tracking (task_id, user_id, hours_logged, description, logged_date, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [taskId, user_id, hours_logged, description, logged_date || new Date(), user_id]);
            
            res.status(201).json({
                success: true,
                message: 'Time entry logged successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error logging time entry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to log time entry',
                error: error.message
            });
        }
    },

    // Get time entry by ID
    getTimeEntryById: async (req, res) => {
        try {
            const { entryId } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT tt.*, u.name as user_name, t.title as task_title, p.name as project_name
                FROM t_time_tracking tt
                LEFT JOIN t_user u ON tt.user_id = u.id
                LEFT JOIN t_task t ON tt.task_id = t.id
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE tt.id = ? AND tt.deleted_at IS NULL
            `, [entryId]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Time entry not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching time entry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch time entry',
                error: error.message
            });
        }
    },

    // Update time entry
    updateTimeEntry: async (req, res) => {
        try {
            const { entryId } = req.params;
            const { hours_logged, description, logged_date } = req.body;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_time_tracking 
                SET hours_logged = ?, description = ?, logged_date = ?, updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [hours_logged, description, logged_date, entryId]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Time entry not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Time entry updated successfully'
            });
        } catch (error) {
            console.error('Error updating time entry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update time entry',
                error: error.message
            });
        }
    },

    // Delete time entry
    deleteTimeEntry: async (req, res) => {
        try {
            const { entryId } = req.params;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_time_tracking 
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = ? AND deleted_at IS NULL
            `, [entryId]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Time entry not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Time entry deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting time entry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete time entry',
                error: error.message
            });
        }
    },

    // Get user time entries
    getUserTimeEntries: async (req, res) => {
        try {
            const { userId } = req.params;
            const { start_date, end_date } = req.query;
            const connection = await dbHots();
            
            let query = `
                SELECT tt.*, t.title as task_title, p.name as project_name
                FROM t_time_tracking tt
                LEFT JOIN t_task t ON tt.task_id = t.id
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE tt.user_id = ? AND tt.deleted_at IS NULL
            `;
            const params = [userId];
            
            if (start_date) {
                query += ` AND tt.logged_date >= ?`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND tt.logged_date <= ?`;
                params.push(end_date);
            }
            
            query += ` ORDER BY tt.logged_date DESC, tt.created_at DESC`;
            
            const [rows] = await connection.execute(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching user time entries:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user time entries',
                error: error.message
            });
        }
    },

    // Get user time summary
    getUserTimeSummary: async (req, res) => {
        try {
            const { userId } = req.params;
            const { start_date, end_date } = req.query;
            const connection = await dbHots();
            
            let query = `
                SELECT 
                    SUM(tt.hours_logged) as total_hours,
                    COUNT(*) as total_entries,
                    COUNT(DISTINCT tt.task_id) as tasks_worked_on,
                    COUNT(DISTINCT DATE(tt.logged_date)) as days_logged
                FROM t_time_tracking tt
                WHERE tt.user_id = ? AND tt.deleted_at IS NULL
            `;
            const params = [userId];
            
            if (start_date) {
                query += ` AND tt.logged_date >= ?`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND tt.logged_date <= ?`;
                params.push(end_date);
            }
            
            const [rows] = await connection.execute(query, params);
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching user time summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user time summary',
                error: error.message
            });
        }
    },

    // Get project time entries
    getProjectTimeEntries: async (req, res) => {
        try {
            const { projectId } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT tt.*, u.name as user_name, t.title as task_title
                FROM t_time_tracking tt
                LEFT JOIN t_user u ON tt.user_id = u.id
                LEFT JOIN t_task t ON tt.task_id = t.id
                WHERE t.project_id = ? AND tt.deleted_at IS NULL
                ORDER BY tt.logged_date DESC, tt.created_at DESC
            `, [projectId]);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching project time entries:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project time entries',
                error: error.message
            });
        }
    },

    // Get project time summary
    getProjectTimeSummary: async (req, res) => {
        try {
            const { projectId } = req.params;
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT 
                    SUM(tt.hours_logged) as total_hours,
                    COUNT(*) as total_entries,
                    COUNT(DISTINCT tt.user_id) as users_involved,
                    COUNT(DISTINCT tt.task_id) as tasks_logged
                FROM t_time_tracking tt
                LEFT JOIN t_task t ON tt.task_id = t.id
                WHERE t.project_id = ? AND tt.deleted_at IS NULL
            `, [projectId]);
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching project time summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project time summary',
                error: error.message
            });
        }
    },

    // Get daily time report
    getDailyTimeReport: async (req, res) => {
        try {
            const { date, user_id } = req.query;
            const connection = await dbHots();
            
            let query = `
                SELECT 
                    tt.logged_date,
                    u.name as user_name,
                    t.title as task_title,
                    p.name as project_name,
                    tt.hours_logged,
                    tt.description
                FROM t_time_tracking tt
                LEFT JOIN t_user u ON tt.user_id = u.id
                LEFT JOIN t_task t ON tt.task_id = t.id
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE tt.deleted_at IS NULL
            `;
            const params = [];
            
            if (date) {
                query += ` AND DATE(tt.logged_date) = ?`;
                params.push(date);
            }
            if (user_id) {
                query += ` AND tt.user_id = ?`;
                params.push(user_id);
            }
            
            query += ` ORDER BY tt.logged_date DESC, u.name ASC`;
            
            const [rows] = await connection.execute(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching daily time report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch daily time report',
                error: error.message
            });
        }
    },

    // Get weekly time report
    getWeeklyTimeReport: async (req, res) => {
        try {
            const { week_start, user_id } = req.query;
            const connection = await dbHots();
            
            let query = `
                SELECT 
                    WEEK(tt.logged_date) as week_number,
                    u.name as user_name,
                    p.name as project_name,
                    SUM(tt.hours_logged) as total_hours,
                    COUNT(*) as entry_count
                FROM t_time_tracking tt
                LEFT JOIN t_user u ON tt.user_id = u.id
                LEFT JOIN t_task t ON tt.task_id = t.id
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE tt.deleted_at IS NULL
            `;
            const params = [];
            
            if (week_start) {
                query += ` AND tt.logged_date >= ? AND tt.logged_date <= DATE_ADD(?, INTERVAL 6 DAY)`;
                params.push(week_start, week_start);
            }
            if (user_id) {
                query += ` AND tt.user_id = ?`;
                params.push(user_id);
            }
            
            query += ` GROUP BY WEEK(tt.logged_date), u.id, p.id ORDER BY week_number DESC, u.name ASC`;
            
            const [rows] = await connection.execute(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching weekly time report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch weekly time report',
                error: error.message
            });
        }
    },

    // Get monthly time report
    getMonthlyTimeReport: async (req, res) => {
        try {
            const { month, year, user_id } = req.query;
            const connection = await dbHots();
            
            let query = `
                SELECT 
                    YEAR(tt.logged_date) as year,
                    MONTH(tt.logged_date) as month,
                    u.name as user_name,
                    p.name as project_name,
                    SUM(tt.hours_logged) as total_hours,
                    COUNT(*) as entry_count
                FROM t_time_tracking tt
                LEFT JOIN t_user u ON tt.user_id = u.id
                LEFT JOIN t_task t ON tt.task_id = t.id
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE tt.deleted_at IS NULL
            `;
            const params = [];
            
            if (month && year) {
                query += ` AND MONTH(tt.logged_date) = ? AND YEAR(tt.logged_date) = ?`;
                params.push(month, year);
            }
            if (user_id) {
                query += ` AND tt.user_id = ?`;
                params.push(user_id);
            }
            
            query += ` GROUP BY YEAR(tt.logged_date), MONTH(tt.logged_date), u.id, p.id ORDER BY year DESC, month DESC, u.name ASC`;
            
            const [rows] = await connection.execute(query, params);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching monthly time report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch monthly time report',
                error: error.message
            });
        }
    },

    // Start timer
    startTimer: async (req, res) => {
        try {
            const { task_id } = req.body;
            const user_id = req.userId;
            const connection = await dbHots();
            
            // Check if user has an active timer
            const [activeTimer] = await connection.execute(`
                SELECT * FROM t_active_timers 
                WHERE user_id = ? AND ended_at IS NULL
            `, [user_id]);
            
            if (activeTimer.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have an active timer running'
                });
            }
            
            const [result] = await connection.execute(`
                INSERT INTO t_active_timers (user_id, task_id, started_at, created_by)
                VALUES (?, ?, NOW(), ?)
            `, [user_id, task_id, user_id]);
            
            res.status(201).json({
                success: true,
                message: 'Timer started successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error starting timer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start timer',
                error: error.message
            });
        }
    },

    // Stop timer
    stopTimer: async (req, res) => {
        try {
            const { description } = req.body;
            const user_id = req.userId;
            const connection = await dbHots();
            
            // Get active timer
            const [activeTimer] = await connection.execute(`
                SELECT * FROM t_active_timers 
                WHERE user_id = ? AND ended_at IS NULL
            `, [user_id]);
            
            if (activeTimer.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No active timer found'
                });
            }
            
            const timer = activeTimer[0];
            const endTime = new Date();
            const hours_logged = (endTime - new Date(timer.started_at)) / (1000 * 60 * 60); // Convert to hours
            
            // End the timer
            await connection.execute(`
                UPDATE t_active_timers 
                SET ended_at = NOW(), updated_at = NOW()
                WHERE id = ?
            `, [timer.id]);
            
            // Create time tracking entry
            const [result] = await connection.execute(`
                INSERT INTO t_time_tracking (task_id, user_id, hours_logged, description, logged_date, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [timer.task_id, user_id, hours_logged.toFixed(2), description, new Date(), user_id]);
            
            res.status(200).json({
                success: true,
                message: 'Timer stopped and time logged successfully',
                data: { 
                    time_entry_id: result.insertId,
                    hours_logged: hours_logged.toFixed(2)
                }
            });
        } catch (error) {
            console.error('Error stopping timer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to stop timer',
                error: error.message
            });
        }
    },

    // Get current timer
    getCurrentTimer: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [rows] = await connection.execute(`
                SELECT at.*, t.title as task_title, p.name as project_name
                FROM t_active_timers at
                LEFT JOIN t_task t ON at.task_id = t.id
                LEFT JOIN t_project p ON t.project_id = p.id
                WHERE at.user_id = ? AND at.ended_at IS NULL
            `, [user_id]);
            
            if (rows.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: null,
                    message: 'No active timer found'
                });
            }
            
            const timer = rows[0];
            const now = new Date();
            const elapsed_seconds = Math.floor((now - new Date(timer.started_at)) / 1000);
            
            res.status(200).json({
                success: true,
                data: {
                    ...timer,
                    elapsed_seconds
                }
            });
        } catch (error) {
            console.error('Error fetching current timer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch current timer',
                error: error.message
            });
        }
    }
};

module.exports = time_tracking_controller;