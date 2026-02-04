/**
 * core/sse-manager.js
 * 
 * Server-Sent Events Manager for HOTS
 * Manages SSE connections per user and provides utility functions to emit targeted events.
 * Now includes persistent notification support via user_notification table.
 * 
 * Usage:
 *   const sseManager = require('./core/sse-manager');
 *   sseManager.emitToUser(userId, 'badge_update', { count: 5 });
 *   sseManager.emitToUsers([1, 2, 3], 'ticket_created', { ticketId: '...' });
 *   
 *   // With persistence (for actionable notifications):
 *   sseManager.emitToUser(userId, 'approval_needed', data, { persist: true, title: 'New Approval', message: 'Ticket #123 requires approval' });
 */

const { createNotification, updateNotification } = require('../controller/hots_controller/notification/notificationController');

// Event types that should be persisted to the database
const PERSISTENT_EVENT_TYPES = [
    'approval_needed',
    'ticket_approved',
    'ticket_rejected',
    'ticket_assigned',
    'task_assigned',
    'task_moved',
    'new_comment',
    'doc_generation_started',
    'doc_generation_complete',
    // 🆕 Phase 3: Added for comprehensive notification tracking
    'ticket_status_update',  // Generic status changes (approved, rejected, closed)
    'badge_update',          // Sidebar badge count changes
    'assignment_update',     // Assignment status changes
    'email_sending',         // Async email status (processing/success/error)
];

class SSEManager {
    constructor() {
        // Map: userId -> Set of response objects (multiple tabs/devices)
        this.connections = new Map();
        // Set of response objects for admin log streaming
        this.adminConnections = new Set();
    }

    /**
     * Register a new SSE connection for a user
     * @param {number|string} userId 
     * @param {Response} res - Express response object
     */
    addConnection(userId, res) {
        const uid = String(userId);
        if (!this.connections.has(uid)) {
            this.connections.set(uid, new Set());
        }
        this.connections.get(uid).add(res);
        console.log(`🔌 SSE: User ${uid} connected. Total connections for user: ${this.connections.get(uid).size}`);
    }

    /**
     * Remove a connection when client disconnects
     * @param {number|string} userId 
     * @param {Response} res 
     */
    removeConnection(userId, res) {
        const uid = String(userId);
        if (this.connections.has(uid)) {
            this.connections.get(uid).delete(res);
            console.log(`🔌 SSE: User ${uid} disconnected. Remaining: ${this.connections.get(uid).size}`);
            if (this.connections.get(uid).size === 0) {
                this.connections.delete(uid);
            }
        }
    }

    /**
     * Emit event to a specific user (all their tabs/devices)
     * @param {number|string} userId 
     * @param {string} eventType - Event name (e.g., 'badge_update', 'ticket_status')
     * @param {object} data - Payload data
     * @param {object} options - Optional { persist: bool, title: string, message: string }
     * @returns {Promise<{sent: boolean, notificationId?: number}>}
     */
    async emitToUser(userId, eventType, data, options = {}) {
        const uid = String(userId);
        let notificationId = null;

        // Persist to database if this is an actionable event type or explicitly requested
        const shouldPersist = options.persist || PERSISTENT_EVENT_TYPES.includes(eventType);
        if (shouldPersist) {
            try {
                notificationId = await createNotification({
                    user_id: parseInt(userId),
                    type: eventType,
                    title: options.title || this._generateTitle(eventType, data),
                    message: options.message || this._generateMessage(eventType, data),
                    data_payload: data
                });
                console.log(`📥 SSE: Persisted notification ${notificationId} for user ${userId}`);
            } catch (err) {
                console.error(`SSE persist error for user ${userId}:`, err.message);
            }
        }

        // Send real-time event
        const userConnections = this.connections.get(uid);
        if (!userConnections || userConnections.size === 0) {
            // User not connected, but notification was persisted
            return { sent: false, notificationId };
        }

        const payload = JSON.stringify({
            type: eventType,
            data,
            timestamp: Date.now(),
            notificationId
        });

        userConnections.forEach(res => {
            try {
                res.write(`event: ${eventType}\n`);
                res.write(`data: ${payload}\n\n`);
            } catch (err) {
                console.error(`SSE write error for user ${userId}:`, err.message);
            }
        });

        console.log(`📡 SSE: Sent '${eventType}' to user ${userId}`);
        return { sent: true, notificationId };
    }

    /**
     * Update an existing notification (for async operations)
     * @param {number} notificationId 
     * @param {object} updates - { title, message, type, data_payload }
     */
    async updateNotification(notificationId, updates) {
        return await updateNotification(notificationId, updates);
    }

    /**
     * Generate default title based on event type
     */
    _generateTitle(eventType, data) {
        const titles = {
            'approval_needed': 'Approval Required',
            'ticket_approved': 'Ticket Approved',
            'ticket_rejected': 'Ticket Rejected',
            'ticket_assigned': 'New Assignment',
            'task_assigned': 'Task Assigned',
            'task_moved': 'Task Updated',
            'new_comment': 'New Comment',
            'doc_generation_started': 'Generating Document...',
            'doc_generation_complete': 'Document Ready'
        };
        return titles[eventType] || 'Notification';
    }

    /**
     * Generate default message based on event type and data
     */
    _generateMessage(eventType, data) {
        const ticketId = data.ticket_id || data.ticketId || '';
        const messages = {
            'approval_needed': `Ticket #${ticketId} requires your approval`,
            'ticket_approved': `Your ticket #${ticketId} has been approved`,
            'ticket_rejected': `Your ticket #${ticketId} has been rejected`,
            'ticket_assigned': `You have been assigned to ticket #${ticketId}`,
            'task_assigned': `A new task has been assigned to you`,
            'task_moved': `Task status has been updated`,
            'new_comment': `New comment on ticket #${ticketId}`,
            'doc_generation_started': `${data.docName || 'Document'} is being generated...`,
            'doc_generation_complete': `${data.docName || 'Document'} is ready for download`
        };
        return messages[eventType] || 'You have a new notification';
    }

    /**
     * Emit event to multiple users
     * @param {number[]} userIds 
     * @param {string} eventType 
     * @param {object} data 
     */
    emitToUsers(userIds, eventType, data) {
        let sentCount = 0;
        userIds.forEach(userId => {
            if (this.emitToUser(userId, eventType, data)) {
                sentCount++;
            }
        });
        return sentCount;
    }

    /**
     * Broadcast to ALL connected users
     * @param {string} eventType 
     * @param {object} data 
     */
    broadcast(eventType, data) {
        const payload = JSON.stringify({ type: eventType, data, timestamp: Date.now() });
        let count = 0;

        this.connections.forEach((userConnections, userId) => {
            userConnections.forEach(res => {
                try {
                    res.write(`event: ${eventType}\n`);
                    res.write(`data: ${payload}\n\n`);
                    count++;
                } catch (err) {
                    console.error(`SSE broadcast error for user ${userId}:`, err.message);
                }
            });
        });

        console.log(`📡 SSE: Broadcast '${eventType}' to ${count} connections`);
        return count;
    }

    /**
     * Get connection stats
     */
    getStats() {
        let totalConnections = 0;
        this.connections.forEach(set => totalConnections += set.size);
        return {
            uniqueUsers: this.connections.size,
            totalConnections,
            adminConnections: this.adminConnections.size
        };
    }

    /**
     * Register a new Admin Log SSE connection
     * @param {Response} res 
     */
    addAdminConnection(res) {
        this.adminConnections.add(res);
        console.log(`🔌 SSE (Admin): New log listener connected. Total admins: ${this.adminConnections.size}`);
    }

    /**
     * Remove an Admin Log SSE connection
     * @param {Response} res 
     */
    removeAdminConnection(res) {
        if (this.adminConnections.has(res)) {
            this.adminConnections.delete(res);
            console.log(`🔌 SSE (Admin): Log listener disconnected. Remaining: ${this.adminConnections.size}`);
        }
    }

    /**
     * Broadcast a log message ONLY to connected admins
     * @param {string} logMsg 
     */
    broadcastLog(logMsg) {
        if (this.adminConnections.size === 0) return;

        // Strip ANSI codes if needed, but for now send raw
        const payload = JSON.stringify({ type: 'log', data: logMsg, timestamp: Date.now() });

        this.adminConnections.forEach(res => {
            try {
                res.write(`event: new_log\n`);
                res.write(`data: ${payload}\n\n`);
            } catch (err) {
                console.error(`SSE Admin broadcast error:`, err.message);
                this.removeAdminConnection(res);
            }
        });
    }
}

// Singleton instance
module.exports = new SSEManager();
