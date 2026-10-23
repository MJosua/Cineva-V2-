/**
 * notificationController.js
 * 
 * Handles CRUD operations for the user_notification table.
 * Provides APIs for fetching, marking as read, and counting notifications.
 */

const { dbHots } = require("../../../config/db");

const yellowTerminal = "\x1b[33m";

/**
 * Get all notifications for the authenticated user.
 * Sorted by created_at DESC, grouped by date on the frontend.
 */
const getNotifications = async (req, res) => {
    const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';
    const user_id = req.dataToken.user_id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const query = `
            SELECT 
                notification_id,
                type,
                title,
                message,
                data_payload,
                is_read,
                created_at
            FROM user_notification
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await dbHots.promise().query(query, [user_id, limit, offset]);

        // Parse JSON payload for each notification
        const notifications = results.map(n => ({
            ...n,
            data_payload: typeof n.data_payload === 'string'
                ? JSON.parse(n.data_payload)
                : n.data_payload
        }));

        res.status(200).json({
            success: true,
            message: "Notifications fetched",
            data: notifications
        });
        console.log(timestamp, `GET Notifications for user ${user_id}: ${notifications.length} items`);
    } catch (err) {
        console.error(timestamp, "Get Notifications Error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Get unread notification count for the badge.
 */
const getUnreadCount = async (req, res) => {
    const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';
    const user_id = req.dataToken.user_id;

    try {
        const query = `
            SELECT COUNT(*) as unread_count
            FROM user_notification
            WHERE user_id = ? AND is_read = 0
        `;

        const [results] = await dbHots.promise().query(query, [user_id]);
        const count = results[0]?.unread_count || 0;

        res.status(200).json({
            success: true,
            unread_count: count
        });
    } catch (err) {
        console.error(timestamp, "Get Unread Count Error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Mark a single notification as read.
 */
const markAsRead = async (req, res) => {
    const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';
    const user_id = req.dataToken.user_id;
    const notification_id = req.params.id;

    try {
        const query = `
            UPDATE user_notification
            SET is_read = 1
            WHERE notification_id = ? AND user_id = ?
        `;

        const [result] = await dbHots.promise().query(query, [notification_id, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
        console.log(timestamp, `Marked notification ${notification_id} as read for user ${user_id}`);
    } catch (err) {
        console.error(timestamp, "Mark As Read Error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Mark all notifications as read for the user.
 */
const markAllRead = async (req, res) => {
    const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';
    const user_id = req.dataToken.user_id;

    try {
        const query = `
            UPDATE user_notification
            SET is_read = 1
            WHERE user_id = ? AND is_read = 0
        `;

        const [result] = await dbHots.promise().query(query, [user_id]);

        res.status(200).json({
            success: true,
            message: `Marked ${result.affectedRows} notifications as read`
        });
        console.log(timestamp, `Marked all notifications as read for user ${user_id}`);
    } catch (err) {
        console.error(timestamp, "Mark All Read Error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Update an existing notification (for async operations like doc generation).
 * Called internally by the system, not by user.
 */
const updateNotification = async (notificationId, updates) => {
    const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';

    try {
        const fields = [];
        const values = [];

        if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);
        }
        if (updates.message !== undefined) {
            fields.push('message = ?');
            values.push(updates.message);
        }
        if (updates.type !== undefined) {
            fields.push('type = ?');
            values.push(updates.type);
        }
        if (updates.data_payload !== undefined) {
            fields.push('data_payload = ?');
            values.push(JSON.stringify(updates.data_payload));
        }

        if (fields.length === 0) return null;

        values.push(notificationId);

        const query = `
            UPDATE user_notification
            SET ${fields.join(', ')}
            WHERE notification_id = ?
        `;

        const [result] = await dbHots.promise().query(query, values);
        console.log(timestamp, `Updated notification ${notificationId}`);
        return result;
    } catch (err) {
        console.error(timestamp, "Update Notification Error:", err);
        throw err;
    }
};

/**
 * Create a new notification (called internally by sseManager).
 * Returns the inserted notification_id.
 * Includes deduplication: same notification within 10 seconds is skipped.
 */
const createNotification = async ({ user_id, type, title, message, data_payload }) => {
    const timestamp = yellowTerminal + new Date().toLocaleString('id') + ' : ';

    try {
        const payload = data_payload ? JSON.stringify(data_payload) : null;

        // 🆕 Deduplication: Check for same notification in last 10 seconds
        const [existing] = await dbHots.promise().query(
            `SELECT notification_id FROM user_notification 
             WHERE user_id = ? AND type = ? AND data_payload = ? 
             AND created_at > DATE_SUB(NOW(), INTERVAL 10 SECOND)
             LIMIT 1`,
            [user_id, type, payload]
        );

        if (existing.length > 0) {
            console.log(timestamp, `Skipped duplicate notification for user ${user_id}: ${type}`);
            return existing[0].notification_id;  // Return existing ID instead of creating new
        }

        const query = `
            INSERT INTO user_notification (user_id, type, title, message, data_payload)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await dbHots.promise().query(query, [user_id, type, title, message, payload]);

        console.log(timestamp, `Created notification for user ${user_id}: ${type}`);
        return result.insertId;
    } catch (err) {
        console.error(timestamp, "Create Notification Error:", err);
        throw err;
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllRead,
    updateNotification,
    createNotification
};
