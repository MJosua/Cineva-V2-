const { dbHots } = require('../../config/db');

const notification_controller = {
    // Get user notifications
    getUserNotifications: async (req, res) => {
        try {
            const user_id = req.userId;
            const { limit = 50, offset = 0 } = req.query;
            const connection = await dbHots();
            
            const [rows] = await connection.execute(`
                SELECT n.*, u.name as sender_name
                FROM t_notifications n
                LEFT JOIN t_user u ON n.created_by = u.id
                WHERE n.user_id = ? AND n.deleted_at IS NULL
                ORDER BY n.created_at DESC
                LIMIT ? OFFSET ?
            `, [user_id, parseInt(limit), parseInt(offset)]);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: error.message
            });
        }
    },

    // Get unread notifications
    getUnreadNotifications: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [rows] = await connection.execute(`
                SELECT n.*, u.name as sender_name
                FROM t_notifications n
                LEFT JOIN t_user u ON n.created_by = u.id
                WHERE n.user_id = ? AND n.is_read = 0 AND n.deleted_at IS NULL
                ORDER BY n.created_at DESC
            `, [user_id]);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch unread notifications',
                error: error.message
            });
        }
    },

    // Get notification count
    getNotificationCount: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [rows] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
                FROM t_notifications 
                WHERE user_id = ? AND deleted_at IS NULL
            `, [user_id]);
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching notification count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification count',
                error: error.message
            });
        }
    },

    // Create notification
    createNotification: async (req, res) => {
        try {
            const { user_id, title, message, type, related_id, related_type } = req.body;
            const created_by = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                INSERT INTO t_notifications (user_id, title, message, type, related_id, related_type, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [user_id, title, message, type, related_id, related_type, created_by]);
            
            res.status(201).json({
                success: true,
                message: 'Notification created successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create notification',
                error: error.message
            });
        }
    },

    // Get notification by ID
    getNotificationById: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [rows] = await connection.execute(`
                SELECT n.*, u.name as sender_name
                FROM t_notifications n
                LEFT JOIN t_user u ON n.created_by = u.id
                WHERE n.id = ? AND n.user_id = ? AND n.deleted_at IS NULL
            `, [id, user_id]);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification',
                error: error.message
            });
        }
    },

    // Update notification
    updateNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, message, type } = req.body;
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_notifications 
                SET title = ?, message = ?, type = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            `, [title, message, type, id, user_id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification updated successfully'
            });
        } catch (error) {
            console.error('Error updating notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update notification',
                error: error.message
            });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_notifications 
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            `, [id, user_id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_notifications 
                SET is_read = 1, read_at = NOW(), updated_at = NOW()
                WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            `, [id, user_id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    },

    // Mark notification as unread
    markAsUnread: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_notifications 
                SET is_read = 0, read_at = NULL, updated_at = NOW()
                WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            `, [id, user_id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification marked as unread'
            });
        } catch (error) {
            console.error('Error marking notification as unread:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as unread',
                error: error.message
            });
        }
    },

    // Mark all notifications as read
    markAllAsRead: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_notifications 
                SET is_read = 1, read_at = NOW(), updated_at = NOW()
                WHERE user_id = ? AND is_read = 0 AND deleted_at IS NULL
            `, [user_id]);
            
            res.status(200).json({
                success: true,
                message: `${result.affectedRows} notifications marked as read`
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: error.message
            });
        }
    },

    // Delete all read notifications
    deleteAllRead: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [result] = await connection.execute(`
                UPDATE t_notifications 
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE user_id = ? AND is_read = 1 AND deleted_at IS NULL
            `, [user_id]);
            
            res.status(200).json({
                success: true,
                message: `${result.affectedRows} read notifications deleted`
            });
        } catch (error) {
            console.error('Error deleting all read notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete read notifications',
                error: error.message
            });
        }
    },

    // Get notification preferences
    getNotificationPreferences: async (req, res) => {
        try {
            const user_id = req.userId;
            const connection = await dbHots();
            
            const [rows] = await connection.execute(`
                SELECT * FROM t_notification_preferences 
                WHERE user_id = ?
            `, [user_id]);
            
            if (rows.length === 0) {
                // Return default preferences
                return res.status(200).json({
                    success: true,
                    data: {
                        email_notifications: true,
                        push_notifications: true,
                        task_assignments: true,
                        project_updates: true,
                        deadline_reminders: true,
                        team_mentions: true
                    }
                });
            }
            
            res.status(200).json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification preferences',
                error: error.message
            });
        }
    },

    // Update notification preferences
    updateNotificationPreferences: async (req, res) => {
        try {
            const user_id = req.userId;
            const preferences = req.body;
            const connection = await dbHots();
            
            // Check if preferences exist
            const [existing] = await connection.execute(`
                SELECT id FROM t_notification_preferences WHERE user_id = ?
            `, [user_id]);
            
            if (existing.length === 0) {
                // Insert new preferences
                await connection.execute(`
                    INSERT INTO t_notification_preferences (user_id, email_notifications, push_notifications, task_assignments, project_updates, deadline_reminders, team_mentions)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [user_id, preferences.email_notifications, preferences.push_notifications, preferences.task_assignments, preferences.project_updates, preferences.deadline_reminders, preferences.team_mentions]);
            } else {
                // Update existing preferences
                await connection.execute(`
                    UPDATE t_notification_preferences 
                    SET email_notifications = ?, push_notifications = ?, task_assignments = ?, project_updates = ?, deadline_reminders = ?, team_mentions = ?, updated_at = NOW()
                    WHERE user_id = ?
                `, [preferences.email_notifications, preferences.push_notifications, preferences.task_assignments, preferences.project_updates, preferences.deadline_reminders, preferences.team_mentions, user_id]);
            }
            
            res.status(200).json({
                success: true,
                message: 'Notification preferences updated successfully'
            });
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update notification preferences',
                error: error.message
            });
        }
    },

    // Broadcast notification (admin only)
    broadcastNotification: async (req, res) => {
        try {
            const { title, message, type, target_users } = req.body;
            const created_by = req.userId;
            const connection = await dbHots();
            
            let userIds = target_users;
            if (!userIds || userIds.length === 0) {
                // Get all active users
                const [users] = await connection.execute(`
                    SELECT id FROM t_user WHERE status = 'active' AND deleted_at IS NULL
                `);
                userIds = users.map(u => u.id);
            }
            
            // Create notifications for each user
            const values = userIds.map(userId => [userId, title, message, type, created_by]).flat();
            const placeholders = userIds.map(() => '(?, ?, ?, ?, ?)').join(', ');
            
            await connection.execute(`
                INSERT INTO t_notifications (user_id, title, message, type, created_by)
                VALUES ${placeholders}
            `, values);
            
            res.status(201).json({
                success: true,
                message: `Notification broadcasted to ${userIds.length} users`
            });
        } catch (error) {
            console.error('Error broadcasting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to broadcast notification',
                error: error.message
            });
        }
    },

    // Get notification templates
    getNotificationTemplates: async (req, res) => {
        try {
            const connection = await dbHots();
            const [rows] = await connection.execute(`
                SELECT * FROM t_notification_templates 
                WHERE deleted_at IS NULL
                ORDER BY name ASC
            `);
            
            res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error fetching notification templates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification templates',
                error: error.message
            });
        }
    }
};

module.exports = notification_controller;